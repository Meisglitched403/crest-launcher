import json
from pathlib import Path
from . import modrinth
from .. import config, profiles


def _mods_dir(profile_name):
    return config.INSTANCES_DIR / profile_name / "mods"


def install_mod(profile_name, slug, game_version, loader):
    profile = profiles.get_profile(profile_name)
    project = modrinth.get_project(slug)
    proj_id = project["id"]
    versions = modrinth.get_versions(proj_id, game_version, loader)
    if not versions:
        raise ValueError(f"No {loader} version of {slug} for MC {game_version}")
    version_data = versions[0]
    # pick the first .jar file
    jar_file = next((f for f in version_data["files"] if f["filename"].endswith(".jar")), None)
    if not jar_file:
        raise ValueError(f"No .jar in {slug} version data")
    dest = _mods_dir(profile_name) / jar_file["filename"]
    modrinth.download_version(version_data, dest)
    # track in profile
    entry = {
        "project_id": proj_id,
        "slug": slug,
        "version_id": version_data["id"],
        "filename": jar_file["filename"],
        "enabled": True,
    }
    profile["mods"] = [m for m in profile["mods"] if m["slug"] != slug]
    profile["mods"].append(entry)
    profiles._save(profile)
    return entry


def remove_mod(profile_name, slug):
    profile = profiles.get_profile(profile_name)
    entry = next((m for m in profile["mods"] if m["slug"] == slug), None)
    if not entry:
        raise ValueError(f"Mod '{slug}' not installed in profile '{profile_name}'")
    jar_path = _mods_dir(profile_name) / entry["filename"]
    disabled_path = _mods_dir(profile_name) / f"{entry['filename']}.disabled"
    if jar_path.exists():
        jar_path.unlink()
    if disabled_path.exists():
        disabled_path.unlink()
    profile["mods"] = [m for m in profile["mods"] if m["slug"] != slug]
    profiles._save(profile)


def list_mods(profile_name):
    profile = profiles.get_profile(profile_name)
    return profile.get("mods", [])


def untracked_mods(profile_name):
    mods_dir = _mods_dir(profile_name)
    if not mods_dir.exists():
        return []
    profile = profiles.get_profile(profile_name)
    tracked_filenames = {m["filename"] for m in profile.get("mods", [])}
    result = []
    for f in sorted(mods_dir.iterdir()):
        if f.suffix in (".jar",) and f.name not in tracked_filenames:
            result.append({"filename": f.name})
        # also check .jar.disabled files
        if f.suffix == ".disabled" and f.stem.endswith(".jar") and f.name not in tracked_filenames:
            filename = f.name.replace(".disabled", "")
            if filename not in tracked_filenames:
                result.append({"filename": filename})
    return result


def adopt_mod(profile_name, filename):
    profile = profiles.get_profile(profile_name)
    base = filename.replace(".disabled", "")
    jar_path = _mods_dir(profile_name) / base
    if not jar_path.exists():
        raise ValueError(f"File not found: {base}")
    entry = {
        "project_id": "",
        "slug": base.replace(".jar", ""),
        "version_id": "",
        "filename": base,
        "enabled": not filename.endswith(".disabled"),
    }
    profile["mods"].append(entry)
    profiles._save(profile)
    return entry


def toggle_mod(profile_name, slug, enabled=None):
    profile = profiles.get_profile(profile_name)
    entry = next((m for m in profile["mods"] if m["slug"] == slug), None)
    if not entry:
        raise ValueError(f"Mod '{slug}' not installed")
    jar = _mods_dir(profile_name) / entry["filename"]
    disabled = _mods_dir(profile_name) / f"{entry['filename']}.disabled"
    if enabled is None:
        enabled = not entry["enabled"]
    if enabled:
        if disabled.exists():
            disabled.rename(jar)
    else:
        if jar.exists():
            jar.rename(disabled)
    entry["enabled"] = enabled
    profiles._save(profile)
    return entry
