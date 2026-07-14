from datetime import datetime
from . import config


class GameLog:
    def __init__(self, profile_name):
        ts = datetime.now().strftime("%Y%m%dT%H%M%S")
        self.path = config.LOGS_DIR / f"{profile_name}-{ts}.log"
        self._fh = open(self.path, "w", encoding="utf-8")

    def write(self, line):
        self._fh.write(line + "\n")
        self._fh.flush()

    def close(self):
        self._fh.close()

    def __enter__(self):
        return self

    def __exit__(self, *args):
        self.close()


def list_logs(profile_name=None):
    logs = sorted(config.LOGS_DIR.glob("*.log"), reverse=True)
    if profile_name:
        logs = [l for l in logs if l.name.startswith(profile_name)]
    return logs
