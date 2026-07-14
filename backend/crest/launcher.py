import re
import subprocess
import sys
import threading
from pathlib import Path
from . import config, versions, java, profiles, logs

# ponytail: only Fabric & Vanilla for now, Forge/NeoForge deferred


def _token_replace(val, tokens):
    if isinstance(val, str):
        for k, v in tokens.items():
            val = val.replace(k, v)
        return val
    if isinstance(val, dict):
        if not versions._rules_pass(val.get("rules", [])):
            return ""
        v = val.get("values", val.get("value", val.get("val", "")))
        if isinstance(v, list):
            return [_token_replace(x, tokens) for x in v]
        return _token_replace(v, tokens)
    return val


def launch(profile_name, auth=None):
    profile = profiles.get_profile(profile_name)
    if not auth:
        from . import auth as auth_mod
        auth = auth_mod.get_auth()
    if not auth:
        raise RuntimeError("Not logged in. Run 'crest login' first.")

    mc_version = profile["version"]
    modloader = profile.get("modloader")
    modloader_ver = profile.get("modloader_version")

    # ponytail: extract real MC version from Fabric IDs like "fabric-loader-0.19.3-26.1.2"
    if modloader == "fabric" and not re.match(r"^\d+\.\d+", mc_version):
        m = re.search(r"(\d+\.\d+(?:\.\d+)?)$", mc_version)
        if m:
            mc_version = m.group(1)

    # resolve the actual version JSON (handles inheritsFrom chains)
    if modloader == "fabric":
        from .mods import modloader as ml
        if not modloader_ver:
            modloader_ver = ml.fabric_latest_loader(mc_version)
            profile["modloader_version"] = modloader_ver
            profiles.update_profile(profile_name, modloader_version=modloader_ver)
        # idempotent — skips download if version JSON already cached locally
        ml.fabric_install(mc_version, modloader_ver)
        version_id = f"fabric-loader-{modloader_ver}-{mc_version}"
    else:
        version_id = mc_version

    vjson = versions.resolve(version_id)
    client = versions.ensure_client(vjson)
    libs = versions.ensure_libraries(vjson)
    assets = versions.ensure_assets(vjson)

    # game directory for this profile
    game_dir = config.INSTANCES_DIR / profile_name
    game_dir.mkdir(parents=True, exist_ok=True)

    # build classpath
    classpath = [str(client)] + [str(l) for l in libs]

    # add mods for fabric/forge profiles
    if modloader:
        for mod in profile.get("mods", []):
            if mod.get("enabled", True):
                mp = config.INSTANCES_DIR / profile_name / "mods" / mod["filename"]
                if mp.exists():
                    classpath.append(str(mp))

    # natives path
    natives_path = config.NATIVES_DIR

    # asset index
    ai = vjson.get("assetIndex", {})
    asset_index_id = ai.get("id", mc_version)

    # resolution
    res = profile.get("resolution", {})
    width = res.get("width", 854)
    height = res.get("height", 480)

    # tokens
    tokens = {
        "${auth_player_name}": auth["username"],
        "${auth_uuid}": auth["uuid"],
        "${auth_access_token}": auth["access_token"],
        "${auth_xuid}": auth.get("xuid", "0"),
        "${clientid}": auth.get("clientid", "00000000-0000-0000-0000-000000000000"),
        "${version_name}": version_id,
        "${version_type}": vjson.get("type", "release"),
        "${game_directory}": str(game_dir),
        "${assets_root}": str(config.ASSETS_DIR),
        "${assets_index_name}": asset_index_id,
        "${library_directory}": str(config.LIBS_DIR),
        "${natives_directory}": str(natives_path),
        "${classpath}": ":".join(classpath),
        "${launcher_name}": "crest",
        "${launcher_version}": "0.1.0",
        "${user_properties}": "{}",
        "${user_type}": "msa" if auth.get("type") == "microsoft" else "mojang",
        "${resolution_width}": str(width),
        "${resolution_height}": str(height),
        "${quickPlayPath}": "",
        "${quickPlaySingleplayer}": "",
        "${quickPlayMultiplayer}": "",
        "${quickPlayRealms}": "",
    }

    # find java
    java_path = java.find_java()

    # build jvm args
    jvm_args = []
    has_cp = False
    for arg in vjson.get("arguments", {}).get("jvm", []):
        replaced = _token_replace(arg, tokens)
        if replaced:
            if isinstance(replaced, list):
                jvm_args.extend(replaced)
            else:
                jvm_args.append(replaced)
            if "${classpath}" in str(arg):
                has_cp = True
    if not has_cp:
        jvm_args += ["-cp", ":".join(classpath)]

    # profile java args
    jvm_args.extend(profile.get("java_args", []))

    # main class
    main_class = vjson.get("mainClass", "net.minecraft.client.main.Main")

    # build game args
    game_args = []
    if "arguments" in vjson and "game" in vjson["arguments"]:
        for arg in vjson["arguments"]["game"]:
            replaced = _token_replace(arg, tokens)
            if replaced:
                if isinstance(replaced, list):
                    game_args.extend(replaced)
                else:
                    game_args.append(replaced)
    else:
        legacy = vjson.get("minecraftArguments", "")
        parsed = _token_replace(legacy, tokens).split()
        game_args.extend(parsed)

    game_args.extend(["--width", str(width), "--height", str(height)])

    cmd = [java_path] + jvm_args + [main_class] + game_args

    # launch
    print(f"Launching {profile_name} (MC {mc_version})...")
    print(f"Java: {java_path}")
    print(f"Game dir: {game_dir}")
    if modloader:
        print(f"Mod loader: {modloader} {modloader_ver}")
        print(f"Mods: {len([m for m in profile.get('mods', []) if m.get('enabled')])} enabled")

    glog = logs.GameLog(profile_name)
    glog.write(f"Command: {' '.join(cmd)}\n")

    proc = subprocess.Popen(
        cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
    )

    # tee output to log and console
    for line in proc.stdout:
        sys.stdout.write(line)
        glog.write(line.rstrip())

    proc.wait()
    glog.close()
    print(f"\nProcess exited with code {proc.returncode}")
    return proc.returncode


def launch_async(profile_name, auth=None):
    class AsyncLaunch:
        def __init__(self):
            self.proc = None

        def wait(self):
            if self.proc:
                self.proc.wait()

    import signal as _signal
    profile = profiles.get_profile(profile_name)
    if not auth:
        from . import auth as auth_mod
        auth = auth_mod.get_auth()
    if not auth:
        raise RuntimeError("Not logged in.")

    mc_version = profile["version"]
    modloader = profile.get("modloader")
    modloader_ver = profile.get("modloader_version")

    # ponytail: extract real MC version from Fabric IDs like "fabric-loader-0.19.3-26.1.2"
    if modloader == "fabric" and not re.match(r"^\d+\.\d+", mc_version):
        m = re.search(r"(\d+\.\d+(?:\.\d+)?)$", mc_version)
        if m:
            mc_version = m.group(1)

    if modloader == "fabric":
        from .mods import modloader as ml
        if not modloader_ver:
            modloader_ver = ml.fabric_latest_loader(mc_version)
            profile["modloader_version"] = modloader_ver
            profiles.update_profile(profile_name, modloader_version=modloader_ver)
        ml.fabric_install(mc_version, modloader_ver)
        version_id = f"fabric-loader-{modloader_ver}-{mc_version}"
    else:
        version_id = mc_version

    vjson = versions.resolve(version_id)
    client = versions.ensure_client(vjson)
    libs = versions.ensure_libraries(vjson)
    assets = versions.ensure_assets(vjson)

    game_dir = config.INSTANCES_DIR / profile_name
    game_dir.mkdir(parents=True, exist_ok=True)

    classpath = [str(client)] + [str(l) for l in libs]

    if modloader:
        for mod in profile.get("mods", []):
            if mod.get("enabled", True):
                mp = config.INSTANCES_DIR / profile_name / "mods" / mod["filename"]
                if mp.exists():
                    classpath.append(str(mp))

    natives_path = config.NATIVES_DIR
    ai = vjson.get("assetIndex", {})
    asset_index_id = ai.get("id", mc_version)
    res = profile.get("resolution", {})
    width = res.get("width", 854)
    height = res.get("height", 480)

    tokens = {
        "${auth_player_name}": auth["username"],
        "${auth_uuid}": auth["uuid"],
        "${auth_access_token}": auth["access_token"],
        "${auth_xuid}": auth.get("xuid", "0"),
        "${clientid}": auth.get("clientid", "00000000-0000-0000-0000-000000000000"),
        "${version_name}": version_id,
        "${version_type}": vjson.get("type", "release"),
        "${game_directory}": str(game_dir),
        "${assets_root}": str(config.ASSETS_DIR),
        "${assets_index_name}": asset_index_id,
        "${library_directory}": str(config.LIBS_DIR),
        "${natives_directory}": str(natives_path),
        "${classpath}": ":".join(classpath),
        "${launcher_name}": "crest",
        "${launcher_version}": "0.1.0",
        "${user_properties}": "{}",
        "${user_type}": "msa" if auth.get("type") == "microsoft" else "mojang",
        "${resolution_width}": str(width),
        "${resolution_height}": str(height),
        "${quickPlayPath}": "",
        "${quickPlaySingleplayer}": "",
        "${quickPlayMultiplayer}": "",
        "${quickPlayRealms}": "",
    }

    java_path = java.find_java()

    jvm_args = []
    has_cp = False
    for arg in vjson.get("arguments", {}).get("jvm", []):
        replaced = _token_replace(arg, tokens)
        if replaced:
            if isinstance(replaced, list):
                jvm_args.extend(replaced)
            else:
                jvm_args.append(replaced)
            if "${classpath}" in str(arg):
                has_cp = True
    if not has_cp:
        jvm_args += ["-cp", ":".join(classpath)]
    jvm_args.extend(profile.get("java_args", []))
    main_class = vjson.get("mainClass", "net.minecraft.client.main.Main")

    game_args = []
    if "arguments" in vjson and "game" in vjson["arguments"]:
        for arg in vjson["arguments"]["game"]:
            replaced = _token_replace(arg, tokens)
            if replaced:
                if isinstance(replaced, list):
                    game_args.extend(replaced)
                else:
                    game_args.append(replaced)
    else:
        legacy = vjson.get("minecraftArguments", "")
        parsed = _token_replace(legacy, tokens).split()
        game_args.extend(parsed)
    game_args.extend(["--width", str(width), "--height", str(height)])

    cmd = [java_path] + jvm_args + [main_class] + game_args

    result = AsyncLaunch()
    result.proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, bufsize=1)
    log_path = config.LOGS_DIR / f"game_{profile_name}_{result.proc.pid}.log"
    print(f"Launched {profile_name} (PID {result.proc.pid} log {log_path})")

    def _wait():
        with open(log_path, "w") as log_file:
            log_file.write(f"Command: {' '.join(cmd)}\n\n")
            for line in result.proc.stdout:
                log_file.write(line)
        result.proc.wait()
        with open(log_path, "a") as log_file:
            log_file.write(f"\nProcess {result.proc.pid} exited with code {result.proc.returncode}\n")
        print(f"\nProcess {result.proc.pid} exited with code {result.proc.returncode}")

    threading.Thread(target=_wait, daemon=True).start()
    return result.proc.pid
