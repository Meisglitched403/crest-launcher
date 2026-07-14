import json
from . import config


def _path(name):
    return config.PROFILES_DIR / f"{name}.json"


def list_profiles():
    files = sorted(config.PROFILES_DIR.glob("*.json"))
    result = []
    for f in files:
        result.append(json.loads(f.read_text()))
    return result


def get_profile(name):
    p = _path(name)
    if not p.exists():
        raise ValueError(f"Profile '{name}' not found")
    return json.loads(p.read_text())


def create_profile(name, version, modloader=None, java_args=None, resolution=None):
    p = _path(name)
    if p.exists():
        raise ValueError(f"Profile '{name}' already exists")
    profile = {
        "name": name,
        "version": version,
        "modloader": modloader,
        "modloader_version": None,
        "java_args": java_args or ["-Xmx4G", "-Xms512M"],
        "resolution": resolution or {"width": 854, "height": 480},
        "mods": [],
    }
    p.write_text(json.dumps(profile, indent=2))
    _ensure_instance_dir(name)
    return profile


def delete_profile(name):
    p = _path(name)
    if not p.exists():
        raise ValueError(f"Profile '{name}' not found")
    p.unlink()


def update_profile(name, **kwargs):
    profile = get_profile(name)
    for k, v in kwargs.items():
        if v is not None:
            profile[k] = v
    _path(name).write_text(json.dumps(profile, indent=2))
    return profile


def _save(profile):
    _path(profile["name"]).write_text(json.dumps(profile, indent=2))


def _ensure_instance_dir(name):
    base = config.INSTANCES_DIR / name
    for sub in ["mods", "saves", "resourcepacks", "server-resourcepacks", "shaderpacks"]:
        (base / sub).mkdir(parents=True, exist_ok=True)
