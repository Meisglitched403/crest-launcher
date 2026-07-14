import json
import os
import time
import urllib.parse
from http.server import HTTPServer, BaseHTTPRequestHandler, HTTPStatus
from pathlib import Path

from . import config, versions
from .mods import modrinth, manager

STARTED = time.time()


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

        return _err(self, f"Not found: {self.path}", 404)

    def do_POST(self):
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

        if parts == ["api", "game", "launch"]:
            vid = body.get("version_id", "")
            username = body.get("username", "")
            ram_mb = body.get("ram_mb", 4096)
            pname = body.get("profile_name")
            if not vid or not username:
                return _err(self, "version_id and username required")

            from . import auth as amod, launcher as lmod, profiles as pmod
            a = amod.login_offline(username)
            if pname:
                try:
                    p = pmod.get_profile(pname)
                except ValueError:
                    p = pmod.create_profile(pname, vid, modloader="fabric" if "fabric-loader" in vid else None)
                p["version"] = vid
                p["java_args"] = [f"-Xmx{ram_mb}M"]
                pmod._save(p)
                try:
                    pid = lmod.launch_async(pname, a)
                except Exception as e:
                    return _err(self, str(e))
                return _json(self, {"pid": pid})
            else:
                from . import launcher as lmod
                pname = f"_tmp_{username}_{vid.replace('.', '_')}"
                try:
                    pmod.get_profile(pname)
                except ValueError:
                    pmod.create_profile(pname, vid, modloader="fabric" if "fabric-loader" in vid else None)
                p = pmod.get_profile(pname)
                p["version"] = vid
                p["java_args"] = [f"-Xmx{ram_mb}M"]
                pmod._save(p)
                try:
                    pid = lmod.launch_async(pname, a)
                except Exception as e:
                    return _err(self, str(e))
                return _json(self, {"pid": pid})

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

        return _err(self, f"Not found: {self.path}", 404)


def serve(host="127.0.0.1", port=8765):
    server = HTTPServer((host, port), Handler)
    print(f"Crest API on http://{host}:{port}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        server.shutdown()
