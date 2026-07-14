import json
import hashlib
import platform
from pathlib import Path
import requests
from . import config

MANIFEST_URL = "https://piston-meta.mojang.com/mc/game/version_manifest_v2.json"
OS = platform.system().lower()
ARCH = platform.machine().lower()
LIB_RE = "libraries"


def _http_get(url):
    r = requests.get(url, timeout=30)
    r.raise_for_status()
    return r


def _sha1(path):
    return hashlib.sha1(Path(path).read_bytes()).hexdigest() if Path(path).exists() else None


def _download(url, dest, sha1=None):
    dest = Path(dest)
    if dest.exists() and sha1 and _sha1(dest) == sha1:
        return
    dest.parent.mkdir(parents=True, exist_ok=True)
    r = _http_get(url)
    dest.write_bytes(r.content)
    if sha1 and _sha1(dest) != sha1:
        raise RuntimeError(f"SHA1 mismatch for {dest}")


def get_manifest():
    r = _http_get(MANIFEST_URL)
    return r.json()


def list_versions(version_type=None):
    manifest = get_manifest()
    versions = manifest["versions"]
    if version_type:
        versions = [v for v in versions if v["type"] == version_type]
    return versions


def get_version_json(version_id):
    local_path = config.VERSIONS_DIR / f"{version_id}.json"
    if local_path.exists():
        return json.loads(local_path.read_text())
    manifest = get_manifest()
    entry = next((v for v in manifest["versions"] if v["id"] == version_id), None)
    if not entry:
        raise ValueError(f"Version {version_id} not found")
    r = _http_get(entry["url"])
    vjson = r.json()
    local_path.write_text(json.dumps(vjson, indent=2))
    return vjson


def resolve(version_id):
    vjson = get_version_json(version_id)
    if "inheritsFrom" not in vjson:
        return vjson
    parent = resolve(vjson["inheritsFrom"])
    merged = dict(parent)
    for key, val in vjson.items():
        if key == "libraries":
            existing = {l["name"] for l in merged.get("libraries", [])}
            for lib in val:
                if lib["name"] not in existing:
                    merged["libraries"].append(lib)
                    existing.add(lib["name"])
        elif key == "arguments":
            pa = merged.get("arguments", {})
            ca = vjson.get("arguments", {})
            merged["arguments"] = {
                "game": pa.get("game", []) + ca.get("game", []),
                "jvm": pa.get("jvm", []) + ca.get("jvm", []),
            }
        elif key == "downloads":
            if val:
                merged["downloads"] = {**parent.get("downloads", {}), **val}
        elif key == "assetIndex":
            if val and val.get("url"):
                merged["assetIndex"] = val
        elif key == "mainClass":
            if val:
                merged["mainClass"] = val
        elif key not in ("inheritsFrom", "releaseTime", "time"):
            merged[key] = val if val else parent.get(key)
    return merged


def _rules_pass(rules):
    if not rules:
        return True
    allow = False
    for rule in rules:
        features = rule.get("features", {})
        if features:
            continue
        os_req = rule.get("os", {})
        match = True
        if "name" in os_req and os_req["name"] != OS:
            match = False
        if "arch" in os_req:
            if os_req["arch"] == "x86" and ARCH not in ("x86", "i386", "i686"):
                match = False
            elif os_req["arch"] == "x86_64" and ARCH not in ("x86_64", "amd64"):
                match = False
        if match:
            allow = rule["action"] == "allow"
    return allow


def _lib_path(lib):
    parts = lib["name"].split(":")
    group, artifact, version = parts[0], parts[1], parts[2]
    if len(parts) >= 4:
        classifier = parts[3]
        return f"{group.replace('.', '/')}/{artifact}/{version}/{artifact}-{version}-{classifier}.jar"
    return f"{group.replace('.', '/')}/{artifact}/{version}/{artifact}-{version}.jar"


def _lib_url(lib, path=None):
    dl = lib.get("downloads", {})
    art = dl.get("artifact")
    if art:
        return art["url"], art.get("sha1")
    # flat format: artifact is at top level (TLauncher-style)
    if "artifact" in lib:
        return lib["artifact"]["url"], lib["artifact"].get("sha1")
    base = lib.get("url", "https://libraries.minecraft.net/").rstrip("/")
    p = path or _lib_path(lib)
    return f"{base}/{p}", lib.get("sha1")


def ensure_libraries(vjson):
    result = []
    for lib in vjson.get("libraries", []):
        if not _rules_pass(lib.get("rules")):
            continue
        dl = lib.get("downloads", {})
        art = dl.get("artifact")
        flat_art = lib.get("artifact")
        maven_url = lib.get("url")
        if art or flat_art or maven_url:
            url, sha1 = _lib_url(lib)
            dest = config.LIBS_DIR / _lib_path(lib)
            _download(url, dest, sha1)
            result.append(dest)
            # extract natives from 4-part-name native jars
            if len(lib["name"].split(":")) >= 4 and lib["name"].endswith(":natives-linux"):
                import zipfile
                config.NATIVES_DIR.mkdir(parents=True, exist_ok=True)
                with zipfile.ZipFile(dest) as zf:
                    for entry in zf.infolist():
                        if any(entry.filename.endswith(ext) for ext in (".so", ".dll", ".dylib", ".jnilib")):
                            zf.extract(entry, config.NATIVES_DIR)
        # native classifier (old format, pre-1.20)
        natives_map = lib.get("natives", {})
        if natives_map and OS in natives_map:
            classifier = natives_map[OS]
            classifiers = dl.get("classifiers", {})
            if classifier in classifiers:
                info = classifiers[classifier]
                parts = lib["name"].split(":")
                a, v = parts[1], parts[2]
                native_dest = config.NATIVES_DIR / f"{a}-{v}-{classifier}.jar"
                _download(info["url"], native_dest, info.get("sha1"))
                import zipfile
                config.NATIVES_DIR.mkdir(parents=True, exist_ok=True)
                with zipfile.ZipFile(native_dest) as zf:
                    for entry in zf.infolist():
                        if any(entry.filename.endswith(ext) for ext in (".so", ".dll", ".dylib", ".jnilib")):
                            zf.extract(entry, config.NATIVES_DIR)
    return result


def ensure_client(vjson):
    dl = vjson.get("downloads", {}).get("client", {})
    if not dl:
        raise RuntimeError("No client download URL")
    dest = config.VERSIONS_DIR / f"{vjson['id']}-client.jar"
    _download(dl["url"], dest, dl.get("sha1"))
    return dest


def ensure_assets(vjson):
    import concurrent.futures

    ai = vjson.get("assetIndex", {})
    if not ai:
        return
    index_dest = config.ASSETS_DIR / "indexes" / f"{ai['id']}.json"
    _download(ai["url"], index_dest, ai.get("sha1"))
    index = json.loads(Path(index_dest).read_text())
    objects = index.get("objects", {})
    total = len(objects)

    to_download = []
    for obj in objects.values():
        h = obj["hash"]
        obj_path = config.ASSETS_DIR / "objects" / h[:2] / h
        if not obj_path.exists():
            to_download.append((h, obj_path))

    if not to_download:
        print(f"Assets: {total} cached, nothing to download")
        return index_dest
    print(f"Assets: {len(to_download)}/{total} to download (8 threads)...")
    done = 0

    def dl_one(args):
        h, obj_path = args
        obj_path.parent.mkdir(parents=True, exist_ok=True)
        url = f"https://resources.download.minecraft.net/{h[:2]}/{h}"
        _download(url, obj_path, h)
        return 1

    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as ex:
        for count in ex.map(dl_one, to_download):
            done += count
            if done % 500 == 0:
                print(f"  {done}/{len(to_download)} assets downloaded")

    print(f"Assets: {done} downloaded")
    return index_dest


def ensure_version(version_id):
    vjson = resolve(version_id)
    client = ensure_client(vjson)
    libs = ensure_libraries(vjson)
    assets = ensure_assets(vjson)
    return vjson, client, libs, assets
