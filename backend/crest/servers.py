import json
import socket
import threading
import time
from pathlib import Path

from .config import DATA_DIR

_db = DATA_DIR / "servers.json"


def _load() -> list[dict]:
    try:
        return json.loads(_db.read_text())
    except (FileNotFoundError, json.JSONDecodeError):
        return []


def _save(servers: list[dict]) -> None:
    _db.parent.mkdir(parents=True, exist_ok=True)
    _db.write_text(json.dumps(servers, indent=2))


def add(name: str, address: str) -> dict:
    existing = _load()
    if any(s["address"] == address for s in existing):
        raise ValueError(f"Server at {address} already exists")
    srv = {"name": name, "address": address, "version": "", "added": int(time.time())}
    existing.append(srv)
    _save(existing)
    return srv


def remove(address: str) -> None:
    existing = [s for s in _load() if s["address"] != address]
    _save(existing)


def list_all() -> list[dict]:
    return _load()


def _do_ping(address: str, timeout: float = 4.0) -> int | None:
    host, _, port_str = address.partition(":")
    port = int(port_str) if port_str else 25565
    try:
        sock = socket.create_connection((host, port), timeout=timeout)
        sock.sendall(b"\xFE\x01")
        res = sock.recv(4096)
        sock.close()
        # Handshake response contains ping data
        if res and res[0] == 0xFF:
            parts = res[3:].split(b"\x00\x00\x00")
            if len(parts) >= 3:
                try:
                    online = int(parts[1])
                    max_players = int(parts[2])
                    return int(time.time() * 1000)
                except ValueError:
                    pass
            return int(time.time() * 1000) - 100
        return int(time.time() * 1000)
    except (socket.timeout, socket.error, OSError):
        return None


def ping(address: str, timeout: float = 4.0) -> dict:
    start = time.time()
    ping_ms = _do_ping(address, timeout)
    elapsed = int((time.time() - start) * 1000)
    return {"address": address, "ping_ms": ping_ms, "elapsed": elapsed}
