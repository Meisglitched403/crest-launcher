import json
import time
import uuid
import hashlib
import secrets
from . import config

ACCOUNTS_FILE = config.DATA_DIR / "accounts.json"
SESSION_FILE = config.DATA_DIR / "session.json"


def _load_accounts():
    if not ACCOUNTS_FILE.exists():
        return {}
    try:
        return json.loads(ACCOUNTS_FILE.read_text())
    except Exception:
        return {}


def _save_accounts(accounts):
    ACCOUNTS_FILE.write_text(json.dumps(accounts, indent=2))


def _hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()


def check_mojang(name):
    import requests
    try:
        r = requests.get(f"https://api.mojang.com/users/profiles/minecraft/{name}", timeout=5)
        if r.status_code == 200:
            return r.json()
    except Exception:
        pass
    return None


def check_availability(display_name):
    accounts = _load_accounts()
    taken = any(a["display_name"] == display_name for a in accounts.values())
    mojang = check_mojang(display_name)
    return {"available": not taken and mojang is None, "mojangMatch": mojang}


def signup(email, username, display_name, password):
    avail = check_availability(display_name)
    if not avail["available"]:
        raise ValueError("Display name taken")

    accounts = _load_accounts()
    for uid, a in accounts.items():
        if a["email"] == email:
            raise ValueError("Email already registered")
        if a["username"] == username:
            raise ValueError("Username already taken")

    user_id = str(uuid.uuid4())
    accounts[user_id] = {
        "id": user_id,
        "email": email,
        "username": username,
        "display_name": display_name,
        "mc_uuid": str(uuid.uuid4()),
        "password_hash": _hash_password(password),
        "created_at": time.time(),
        "last_used": None,
    }
    _save_accounts(accounts)

    jwt = _make_token(user_id)
    account = {k: v for k, v in accounts[user_id].items() if k != "password_hash"}
    _save_session(jwt, account)
    return {"jwt": jwt, "account": account}


def login(email, password):
    accounts = _load_accounts()
    for uid, a in accounts.items():
        if a["email"] == email:
            if a["password_hash"] != _hash_password(password):
                raise ValueError("Invalid email or password")
            a["last_used"] = time.time()
            _save_accounts(accounts)
            jwt = _make_token(uid)
            account = {k: v for k, v in a.items() if k != "password_hash"}
            _save_session(jwt, account)
            return {"jwt": jwt, "account": account}
    raise ValueError("Invalid email or password")


def _make_token(user_id):
    payload = json.dumps({"sub": user_id, "exp": time.time() + 86400 * 7, "iat": time.time()})
    return base64_encode(payload) + "." + base64_encode(str(uuid.uuid4()))


def base64_encode(s):
    import base64
    return base64.urlsafe_b64encode(s.encode()).decode().rstrip("=")


def _decode_token(token):
    try:
        parts = token.split(".")
        payload = json.loads(__import__("base64").urlsafe_b64decode(parts[0] + "=="))
        return payload
    except Exception:
        return None


def get_session():
    if not SESSION_FILE.exists():
        return None
    try:
        data = json.loads(SESSION_FILE.read_text())
        payload = _decode_token(data["jwt"])
        if payload and payload.get("exp", 0) > time.time():
            return data
    except Exception:
        pass
    return None


def _save_session(jwt, account):
    SESSION_FILE.write_text(json.dumps({"jwt": jwt, "account": account}, indent=2))


def logout():
    if SESSION_FILE.exists():
        SESSION_FILE.unlink()


def get_account(account_id, jwt=None):
    accounts = _load_accounts()
    a = accounts.get(account_id)
    if a:
        return {k: v for k, v in a.items() if k != "password_hash"}
    return None
