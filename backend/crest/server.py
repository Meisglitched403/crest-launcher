import json
import os
import signal
import subprocess
import time
import urllib.parse
from http.server import HTTPServer, BaseHTTPRequestHandler, HTTPStatus
from pathlib import Path
from socketserver import ThreadingMixIn

from . import config, versions
from .mods import modrinth, manager
from . import servers

STARTED = time.time()
_game_pid = None

_EXAMPLE_CRASH = {
    "id": "example-oom",
    "title": "OutOfMemoryError — Java heap space",
    "when": "Example · Today",
    "version": "1.21.4",
    "loader": "Fabric 0.16.9",
    "exit": -1,
    "severity": "fatal",
    "cause": "java.lang.OutOfMemoryError: Java heap space",
    "gameLog": "[14:22:03] [Render thread/INFO]: Setting user: Steve_Player\n[14:22:07] [Render thread/INFO]: [Sodium] Loaded 47 mixins\n[14:22:19] [Worker-Main-3/WARN]: Chunk (12, -7) took 812ms to build\n[14:22:41] [Render thread/ERROR]: Unreported exception thrown!\njava.lang.OutOfMemoryError: Java heap space\n    at net.minecraft.world.chunk.ChunkSection.<init>(ChunkSection.java:42)\n    at net.minecraft.world.chunk.WorldChunk.<init>(WorldChunk.java:118)\n    at me.jellysquid.mods.sodium.client.render.SodiumWorldRenderer.setupTerrain(SodiumWorldRenderer.java:186)\n[14:22:41] [Render thread/INFO]: Stopping!\n[14:22:42] [Render thread/INFO]: Process exited with code -1",
    "launcherLog": "[14:21:58] [Crest/INFO]: Preparing launch — profile \"Modded 1.21\"\n[14:21:58] [Crest/INFO]: Allocated RAM: 4G (recommended: 8G)\n[14:22:01] [Crest/INFO]: Spawning JVM (Java 21.0.4)\n[14:22:03] [Crest/INFO]: Game window attached (pid 18422)\n[14:22:41] [Crest/WARN]: Game process exited unexpectedly (-1)\n[14:22:41] [Crest/INFO]: Crash report captured → crash-reports/2026-07-14_14.22.41-client.txt",
}


def _log_severity(text):
    if "FATAL" in text or "OutOfMemory" in text or "unreported exception" in text.lower():
        return "fatal"
    if "ERROR" in text or "Exception" in text or "Failed" in text:
        return "error"
    return "warn"


def _gather_logs():
    entries = [_EXAMPLE_CRASH]
    seen = {e["id"] for e in entries}

    # real game logs from LOGS_DIR
    for f in sorted(config.LOGS_DIR.glob("*.log"), reverse=True)[:20]:
        try:
            text = f.read_text(errors="replace")
        except OSError:
            continue
        lines = text.splitlines()
        title = lines[0][:80] if lines else f.name
        name = f.stem
        if name not in seen:
            seen.add(name)
            entries.append({
                "id": name,
                "title": title,
                "when": time.strftime("%b %d · %H:%M", time.localtime(f.stat().st_mtime)),
                "version": "—",
                "loader": "—",
                "exit": -1,
                "severity": _log_severity(text),
                "cause": title,
                "gameLog": text,
                "launcherLog": text,
            })

    # Minecraft crash reports from instances
    for inst in config.INSTANCES_DIR.iterdir():
        if not inst.is_dir():
            continue
        cr_dir = inst / "crash-reports"
        if not cr_dir.exists():
            continue
        for cr in sorted(cr_dir.glob("*.txt"), reverse=True)[:10]:
            try:
                text = cr.read_text(errors="replace")
            except OSError:
                continue
            cid = cr.stem
            if cid not in seen:
                seen.add(cid)
                lines = text.splitlines()
                title = next((l for l in lines if "Error" in l or "Exception" in l or "Fatal" in l), lines[0][:80])[:80]
                entries.append({
                    "id": cid,
                    "title": title,
                    "when": time.strftime("%b %d · %H:%M", time.localtime(cr.stat().st_mtime)),
                    "version": "—",
                    "loader": "—",
                    "exit": -1,
                    "severity": "fatal" if "fatal" in text.lower() else "error",
                    "cause": lines[0][:120] if lines else title,
                    "gameLog": text,
                    "launcherLog": "",
                })

    return entries


def _body(handler):
    length = int(handler.headers.get("Content-Length", 0))
    if length == 0:
        return {}
    return json.loads(handler.rfile.read(length))


def _json(handler, data, status=200):
    body = json.dumps(data).encode()
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json")
    handler.send_header("Access-Control-Allow-Origin", "*")
    handler.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    handler.send_header("Access-Control-Allow-Headers", "Content-Type")
    handler.send_header("Content-Length", str(len(body)))
    handler.end_headers()
    handler.wfile.write(body)


def _err(handler, msg, status=400):
    _json(handler, {"error": msg}, status)


def _parse(path):
    parsed = urllib.parse.urlparse(path)
    parts = [p for p in parsed.path.split("/") if p]
    qs = urllib.parse.parse_qs(parsed.query)
    return parts, {k: v[0] if len(v) == 1 else v for k, v in qs.items()}


class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        pass

    def do_OPTIONS(self):
        _json(self, {})

    def do_GET(self):
        parts, qs = _parse(self.path)

        if parts == ["api", "health"]:
            return _json(self, {"status": "ok", "uptime": time.time() - STARTED})

        if parts == ["api", "game-dir"]:
            return _json(self, {"path": str(config.INSTANCES_DIR)})

        if parts == ["api", "game", "status"]:
            alive = False
            if _game_pid:
                try:
                    os.kill(_game_pid, 0)
                    alive = True
                except (OSError, ProcessLookupError):
                    pass
            return _json(self, {"pid": _game_pid, "alive": alive})

        if parts == ["api", "java", "ensure"]:
            from . import java as jmod
            try:
                p = jmod.find_java(17)
                v = jmod._get_version(p)
                return _json(self, {"path": p, "version": str(v)})
            except RuntimeError as e:
                return _err(self, str(e))

        if parts == ["api", "versions", "installed"]:
            result = []
            vdir = config.VERSIONS_DIR
            if vdir.exists():
                seen = set()
                for f in vdir.iterdir():
                    name = f.stem if f.suffix == ".json" else f.name
                    if name in seen:
                        continue
                    seen.add(name)
                    vj = f / f"{name}.json" if f.is_dir() else (f if f.suffix == ".json" else None)
                    if vj and vj.exists():
                        data = json.loads(vj.read_text())
                        result.append({
                            "id": data.get("id", name),
                            "display_name": name or data.get("id", name),
                            "loader_type": "fabric" if "fabric-loader" in (name or "") else "vanilla",
                            "mc_version": data.get("inheritsFrom", data.get("id", name)),
                            "installed": True,
                        })
                    elif not vj and f.is_dir() and (f / f"{name}.json").exists():
                        data = json.loads((f / f"{name}.json").read_text())
                        result.append({
                            "id": data.get("id", name),
                            "display_name": name,
                            "loader_type": "fabric" if "fabric-loader" in name else "vanilla",
                            "mc_version": data.get("inheritsFrom", data.get("id", name)),
                            "installed": True,
                        })
            return _json(self, result)

        if len(parts) == 4 and parts[:3] == ["api", "version", "installed"]:
            vid = parts[3]
            lt = qs.get("loader_type", "vanilla")
            if lt == "fabric":
                for cand in config.VERSIONS_DIR.glob("fabric-loader-*"):
                    if vid in cand.name:
                        return _json(self, {"installed": (cand / "profile.json").exists()})
                return _json(self, {"installed": False})
            vd = config.VERSIONS_DIR / vid
            return _json(self, {
                "installed": (vd / f"{vid}.json").exists() and (vd / f"{vid}.jar").exists()
            })

        if parts == ["api", "mods", "search"]:
            try:
                results = modrinth.search(
                    qs.get("q", ""),
                    qs.get("game_version"),
                    qs.get("loader"),
                    int(qs.get("limit", 20)),
                    qs.get("categories"),
                )
                return _json(self, results)
            except Exception as e:
                return _err(self, str(e))

        if parts == ["api", "mods", "list"]:
            mp = qs.get("modpack", "")
            if not mp:
                return _err(self, "modpack required")
            try:
                return _json(self, manager.list_mods(mp))
            except ValueError:
                return _json(self, [])

        if parts == ["api", "mods", "untracked"]:
            mp = qs.get("modpack", "")
            if not mp:
                return _err(self, "modpack required")
            return _json(self, manager.untracked_mods(mp))

        if parts == ["api", "mods", "open-folder"]:
            mp = qs.get("modpack", "")
            if not mp:
                return _err(self, "modpack required")
            folder = config.INSTANCES_DIR / mp / "mods"
            if folder.exists():
                subprocess.Popen(["xdg-open", str(folder)])
                return _json(self, {"status": "ok"})
            else:
                return _err(self, "mods folder not found", 404)

        if parts == ["api", "servers"]:
            return _json(self, servers.list_all())

        if parts == ["api", "accounts", "session"]:
            from . import accounts as accts
            sess = accts.get_session()
            return _json(self, sess if sess else {})

        if parts == ["api", "accounts", "check"]:
            from . import accounts as accts
            name = qs.get("name", "")
            if not name:
                return _err(self, "name required")
            return _json(self, accts.check_availability(name))

        if parts == ["api", "icon"]:
            slug = qs.get("project", "")
            if not slug:
                return _err(self, "project required")
            try:
                proj = modrinth.get_project(slug)
                return _json(self, {"icon_url": proj.get("icon_url")})
            except Exception as e:
                return _json(self, {"icon_url": None})

        if parts == ["api", "logs", "open-folder"]:
            subprocess.Popen(["xdg-open", str(config.LOGS_DIR)])
            return _json(self, {"status": "ok"})

        if parts == ["api", "logs"]:
            return _json(self, _gather_logs())

        if len(parts) == 4 and parts[:3] == ["api", "servers", "ping"]:
            addr = urllib.parse.unquote(parts[3])
            return _json(self, servers.ping(addr))

        return _err(self, f"Not found: {self.path}", 404)

    def do_POST(self):
        global _game_pid
        parts, qs = _parse(self.path)
        body = _body(self)

        if parts == ["api", "version", "install"]:
            vid = body.get("version_id", "")
            lt = body.get("loader_type", "vanilla")
            if not vid:
                return _err(self, "version_id required")

            if lt == "fabric":
                import re
                mc = re.search(r"(\d+\.\d+(?:\.\d+)?)", vid)
                if not mc:
                    return _err(self, "Cant parse MC version")
                mc_ver = mc.group(1)
                from .mods import modloader
                try:
                    lv = modloader.fabric_latest_loader(mc_ver)
                    modloader.fabric_install(mc_ver, lv)
                    rid = f"fabric-loader-{lv}-{mc_ver}"
                except Exception as e:
                    return _err(self, str(e))
                return _json(self, {"id": rid, "mc_version": mc_ver, "loader_type": "fabric"})
            else:
                try:
                    versions.ensure_version(vid)
                except Exception as e:
                    return _err(self, str(e))
                return _json(self, {"id": vid, "mc_version": vid, "loader_type": "vanilla"})

        if parts == ["api", "accounts", "signup"]:
            from . import accounts as accts
            email = body.get("email", "")
            username = body.get("username", "")
            display_name = body.get("displayName", "")
            password = body.get("password", "")
            if not email or not username or not display_name or not password:
                return _err(self, "email, username, displayName, password required")
            try:
                return _json(self, accts.signup(email, username, display_name, password))
            except ValueError as e:
                return _err(self, str(e))

        if parts == ["api", "accounts", "login"]:
            from . import accounts as accts
            email = body.get("email", "")
            password = body.get("password", "")
            if not email or not password:
                return _err(self, "email and password required")
            try:
                return _json(self, accts.login(email, password))
            except ValueError as e:
                return _err(self, str(e))

        if parts == ["api", "accounts", "logout"]:
            from . import accounts as accts
            accts.logout()
            return _json(self, {"status": "ok"})

        if parts == ["api", "game", "launch"]:
            vid = body.get("version_id", "")
            ram_mb = body.get("ram_mb", 4096)
            pname = body.get("profile_name")
            server_address = body.get("server_address")
            account_id = body.get("account_id", "")
            username = body.get("username", "")
            if not vid:
                return _err(self, "version_id required")

            from . import auth as amod, launcher as lmod, profiles as pmod

            if account_id:
                from . import accounts as accts
                sess = accts.get_session()
                if not sess:
                    return _err(self, "Not logged in")
                account = sess["account"]
                if account["id"] != account_id:
                    account = accts.get_account(account_id, sess["jwt"])
                    if not account:
                        return _err(self, "Account not found")
                a = amod.crest_account_auth(account)
                display_name = account["display_name"]
            elif username:
                a = amod.login_offline(username)
                display_name = username
            else:
                return _err(self, "account_id or username required")

            if pname:
                try:
                    p = pmod.get_profile(pname)
                except ValueError:
                    p = pmod.create_profile(pname, vid, modloader="fabric" if "fabric-loader" in vid else None)
                p["version"] = vid
                p["java_args"] = [f"-Xmx{ram_mb}M"]
                if server_address:
                    p["server_address"] = server_address
                pmod._save(p)
                try:
                    pid = lmod.launch_async(pname, a, server_address=server_address)
                    _game_pid = pid
                except Exception as e:
                    return _err(self, str(e))
                return _json(self, {"pid": pid})
            else:
                from . import launcher as lmod
                pname = f"_tmp_{display_name}_{vid.replace('.', '_')}"
                try:
                    pmod.get_profile(pname)
                except ValueError:
                    pmod.create_profile(pname, vid, modloader="fabric" if "fabric-loader" in vid else None)
                p = pmod.get_profile(pname)
                p["version"] = vid
                p["java_args"] = [f"-Xmx{ram_mb}M"]
                if server_address:
                    p["server_address"] = server_address
                pmod._save(p)
                try:
                    pid = lmod.launch_async(pname, a, server_address=server_address)
                    _game_pid = pid
                except Exception as e:
                    return _err(self, str(e))
                return _json(self, {"pid": pid})

        if parts == ["api", "game", "kill"]:
            killed = False
            if _game_pid:
                try:
                    os.kill(_game_pid, signal.SIGTERM)
                    killed = True
                except (OSError, ProcessLookupError):
                    pass
            return _json(self, {"killed": killed})

        if parts == ["api", "mods", "install"]:
            mp = body.get("modpack", "")
            slug = body.get("slug", "")
            gv = body.get("game_version")
            ldr = body.get("loader", "fabric")
            if not mp or not slug:
                return _err(self, "modpack and slug required")
            if not gv:
                from . import profiles as pmod
                try:
                    p = pmod.get_profile(mp)
                    gv = p.get("version")
                except ValueError:
                    pass
            from . import profiles as pmod
            try:
                pmod.get_profile(mp)
            except ValueError:
                pmod.create_profile(mp, gv or "1.21.4")
            try:
                r = manager.install_mod(mp, slug, gv, ldr)
                return _json(self, r)
            except Exception as e:
                return _err(self, str(e))

        if parts == ["api", "mods", "remove"]:
            mp = body.get("modpack", "")
            slug = body.get("slug", "")
            if not mp or not slug:
                return _err(self, "modpack and slug required")
            try:
                manager.remove_mod(mp, slug)
                return _json(self, {"status": "ok"})
            except Exception as e:
                return _err(self, str(e))

        if parts == ["api", "mods", "toggle"]:
            mp = body.get("modpack", "")
            slug = body.get("slug", "")
            if not mp or not slug:
                return _err(self, "modpack and slug required")
            enabled = body.get("enabled")
            try:
                r = manager.toggle_mod(mp, slug, enabled)
                return _json(self, r)
            except Exception as e:
                return _err(self, str(e))

        if parts == ["api", "mods", "adopt"]:
            mp = body.get("modpack", "")
            filename = body.get("filename", "")
            if not mp or not filename:
                return _err(self, "modpack and filename required")
            try:
                r = manager.adopt_mod(mp, filename)
                return _json(self, r)
            except Exception as e:
                return _err(self, str(e))

        if parts == ["api", "instance", "create"]:
            name = body.get("name", "")
            mc_ver = body.get("mc_version", "")
            loader = body.get("loader_type", "vanilla")
            if not name or not mc_ver:
                return _err(self, "name and mc_version required")
            try:
                p = config.INSTANCES_DIR / name
                p.mkdir(parents=True, exist_ok=True)
                for sub in ["mods", "saves", "resourcepacks", "server-resourcepacks", "shaderpacks"]:
                    (p / sub).mkdir(parents=True, exist_ok=True)
                return _json(self, {"status": "ok", "path": str(p)})
            except Exception as e:
                return _err(self, str(e))

        if parts == ["api", "servers", "add"]:
            name = body.get("name", "")
            address = body.get("address", "")
            if not name or not address:
                return _err(self, "name and address required")
            try:
                r = servers.add(name, address)
                return _json(self, r)
            except ValueError as e:
                return _err(self, str(e), 409)

        if parts == ["api", "servers", "remove"]:
            address = body.get("address", "")
            if not address:
                return _err(self, "address required")
            servers.remove(address)
            return _json(self, {"status": "ok"})

        return _err(self, f"Not found: {self.path}", 404)


class ThreadingHTTPServer(ThreadingMixIn, HTTPServer):
    pass


def serve(host="127.0.0.1", port=8765):
    server = ThreadingHTTPServer((host, port), Handler)
    server.daemon_threads = True
    print(f"Crest API on http://{host}:{port}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        server.shutdown()
