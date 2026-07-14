import json
import requests
from .. import config

FABRIC_META = "https://meta.fabricmc.net/v2"
# ponytail: Forge/NeoForge/Quilt deferred, add when needed


def fabric_latest_loader(mc_version):
    r = requests.get(f"{FABRIC_META}/versions/loader/{mc_version}")
    r.raise_for_status()
    entries = r.json()
    if not entries:
        raise ValueError(f"No Fabric loader for {mc_version}")
    return entries[0]["loader"]["version"]


def fabric_install(mc_version, loader_version=None):
    if loader_version is None:
        loader_version = fabric_latest_loader(mc_version)
    url = f"{FABRIC_META}/versions/loader/{mc_version}/{loader_version}/profile/json"
    r = requests.get(url)
    r.raise_for_status()
    fabric_json = r.json()
    v_id = fabric_json["id"]
    dest = config.VERSIONS_DIR / f"{v_id}.json"
    if not dest.exists():
        dest.write_text(json.dumps(fabric_json, indent=2))
    return v_id
