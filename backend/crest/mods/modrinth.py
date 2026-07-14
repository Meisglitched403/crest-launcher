import json
import urllib.parse
import requests

BASE = "https://api.modrinth.com/v2"


def search(query, game_version=None, loader=None, limit=20):
    facets = []
    facets.append(["project_type:mod"])
    if game_version:
        facets.append([f"versions:{game_version}"])
    if loader:
        facets.append([f"categories:{loader}"])
    params = {
        "query": query,
        "limit": limit,
        "facets": json.dumps(facets),
    }
    r = requests.get(f"{BASE}/search", params=params)
    r.raise_for_status()
    return r.json().get("hits", [])


def get_project(slug_or_id):
    r = requests.get(f"{BASE}/project/{slug_or_id}")
    r.raise_for_status()
    return r.json()


def get_versions(project_id, game_version=None, loader=None):
    params = {}
    if game_version:
        params["game_versions"] = json.dumps([game_version])
    if loader:
        params["loaders"] = json.dumps([loader])
    r = requests.get(f"{BASE}/project/{project_id}/version", params=params)
    r.raise_for_status()
    return r.json()


def download_version(version_data, dest):
    for f in version_data.get("files", []):
        if any(f["filename"].endswith(ext) for ext in (".jar", ".jar.disabled")):
            url = f["url"]
            r = requests.get(url, stream=True)
            r.raise_for_status()
            dest.parent.mkdir(parents=True, exist_ok=True)
            with open(dest, "wb") as fh:
                for chunk in r.iter_content(chunk_size=8192):
                    fh.write(chunk)
            return True
    return False
