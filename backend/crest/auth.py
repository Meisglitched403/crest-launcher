import json
import hashlib
import uuid
import time
import requests
from . import config


def offline_uuid(username):
    digest = hashlib.md5(f"OfflinePlayer:{username}".encode("utf-8")).digest()
    ba = bytearray(digest)
    ba[6] = (ba[6] & 0x0f) | 0x30
    ba[8] = (ba[8] & 0x3f) | 0x80
    return str(uuid.UUID(bytes=bytes(ba)))


def login_offline(username):
    if not (3 <= len(username) <= 16 and username.replace("_", "").replace("-", "").isalnum()):
        raise ValueError("Username must be 3-16 chars, alphanumeric with _ or -")
    auth = {
        "type": "offline",
        "username": username,
        "uuid": offline_uuid(username),
        "access_token": uuid.uuid4().hex,
    }
    _save(auth)
    return auth


def login_microsoft(client_id=None):
    client_id = client_id or config.MS_CLIENT_ID
    scope = "XboxLive.signin%20offline_access"
    # Step 1: device code
    r = requests.post(
        "https://login.microsoftonline.com/consumers/oauth2/v2.0/devicecode",
        data={"client_id": client_id, "scope": scope},
    )
    r.raise_for_status()
    dc = r.json()
    print(f"Go to {dc['verification_uri']} and enter code: {dc['user_code']}")
    # Step 2: poll for token
    interval = dc.get("interval", 5)
    expires = dc["expires_in"]
    start = time.time()
    while time.time() - start < expires:
        time.sleep(interval)
        r = requests.post(
            "https://login.microsoftonline.com/consumers/oauth2/v2.0/token",
            data={
                "client_id": client_id,
                "device_code": dc["device_code"],
                "grant_type": "urn:ietf:params:oauth:grant-type:device_code",
            },
        )
        if r.status_code == 200:
            break
        if r.status_code == 400:
            err = r.json().get("error")
            if err == "authorization_declined":
                raise RuntimeError("Authorization declined")
            elif err == "expired_token":
                raise RuntimeError("Device code expired")
            continue
        r.raise_for_status()
    else:
        raise RuntimeError("Timed out waiting for authentication")
    ms_token = r.json()["access_token"]
    # Step 3: Xbox Live auth
    r = requests.post(
        "https://user.auth.xboxlive.com/user/authenticate",
        json={
            "Properties": {"AuthMethod": "RPS", "SiteName": "user.auth.xboxlive.com",
                           "RpsTicket": f"d={ms_token}"},
            "RelyingParty": "http://auth.xboxlive.com",
            "TokenType": "JWT",
        },
        headers={"Accept": "application/json"},
    )
    r.raise_for_status()
    xbl_data = r.json()
    xbl_token = xbl_data["Token"]
    uhs = xbl_data["DisplayClaims"]["xui"][0]["uhs"]
    # Step 4: XSTS auth
    r = requests.post(
        "https://xsts.auth.xboxlive.com/xsts/authorize",
        json={
            "Properties": {"SandboxId": "RETAIL", "UserTokens": [xbl_token]},
            "RelyingParty": "rp://api.minecraftservices.com/",
            "TokenType": "JWT",
        },
        headers={"Accept": "application/json"},
    )
    r.raise_for_status()
    xsts_token = r.json()["Token"]
    # Step 5: Minecraft auth
    r = requests.post(
        "https://api.minecraftservices.com/authentication/login_with_xbox",
        json={"identityToken": f"XBL3.0 x={uhs};{xsts_token}"},
    )
    r.raise_for_status()
    mc_data = r.json()
    mc_token = mc_data["access_token"]
    # Step 6: get profile
    r = requests.get(
        "https://api.minecraftservices.com/minecraft/profile",
        headers={"Authorization": f"Bearer {mc_token}"},
    )
    if r.status_code == 200:
        profile = r.json()
        auth = {
            "type": "microsoft",
            "username": profile["name"],
            "uuid": profile["id"],
            "access_token": mc_token,
        }
    else:
        # token works but no profile (account owns only Bedrock)
        auth = {
            "type": "microsoft",
            "username": "Player",
            "uuid": uuid.uuid4().hex,
            "access_token": mc_token,
        }
    _save(auth)
    return auth


def get_auth():
    if config.AUTH_FILE.exists():
        data = json.loads(config.AUTH_FILE.read_text())
        return data
    return None


def logout():
    if config.AUTH_FILE.exists():
        config.AUTH_FILE.unlink()


def _save(auth):
    config.AUTH_FILE.write_text(json.dumps(auth, indent=2))
