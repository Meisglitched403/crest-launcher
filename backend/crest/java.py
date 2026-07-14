import os
import re
import subprocess
import shutil
from pathlib import Path


def _candidates():
    # JAVA_HOME
    jh = os.environ.get("JAVA_HOME")
    if jh:
        yield Path(jh) / "bin" / "java"
    # SDKMAN
    sdkman = Path.home() / ".sdkman" / "candidates" / "java" / "current" / "bin" / "java"
    if sdkman.exists():
        yield sdkman
    # PATH
    on_path = shutil.which("java")
    if on_path:
        yield Path(on_path)


def find_java(min_version=17):
    tried = []
    for path in _candidates():
        path_str = str(path)
        if not path.exists():
            tried.append(f"{path_str} (not found)")
            continue
        try:
            version = _get_version(path_str)
        except RuntimeError:
            tried.append(f"{path_str} (version parse failed)")
            continue
        if version >= min_version:
            return path_str
        tried.append(f"{path_str} (version {version} < {min_version})")
    # nothing found — give best error
    raise RuntimeError(
        f"Java not found. Tried: {', '.join(tried) if tried else '(none)'}. "
        f"Install Java {min_version}+."
    )


def _get_version(java_path):
    r = subprocess.run([java_path, "-version"], capture_output=True, text=True)
    out = r.stderr or r.stdout
    m = re.search(r'(\d+)\.(\d+)\.(\d+)', out)
    if m:
        major = int(m.group(1))
        if major == 1:
            return int(m.group(2))
        return major
    m = re.search(r'^(\d+)\b', out, re.MULTILINE)
    if m:
        return int(m.group(1))
    raise RuntimeError(f"Cannot parse Java version from: {out[:200]}")
