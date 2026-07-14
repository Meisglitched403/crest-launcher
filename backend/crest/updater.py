import json
import requests

REPO = "glitcher/crest-launcher"
CURRENT = "0.1.0"


def check_update():
    url = f"https://api.github.com/repos/{REPO}/releases/latest"
    try:
        r = requests.get(url, timeout=10)
        r.raise_for_status()
        data = r.json()
        latest = data.get("tag_name", "").lstrip("v")
        if latest > CURRENT:
            return {
                "version": latest,
                "url": data["html_url"],
                "body": data.get("body", ""),
            }
    except Exception:
        pass
    return None
