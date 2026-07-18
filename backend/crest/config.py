from pathlib import Path

HOME = Path.home()
BASE_DIR = HOME / ".crestclient"
CONFIG_DIR = BASE_DIR
DATA_DIR = BASE_DIR
INSTANCES_DIR = DATA_DIR / "instances"
LIBS_DIR = DATA_DIR / "libraries"
ASSETS_DIR = DATA_DIR / "assets"
NATIVES_DIR = DATA_DIR / "natives"
LOGS_DIR = DATA_DIR / "logs"
VERSIONS_DIR = DATA_DIR / "versions"

AUTH_FILE = CONFIG_DIR / "auth.json"
PROFILES_DIR = CONFIG_DIR / "profiles"
CONFIG_FILE = CONFIG_DIR / "config.json"

MS_CLIENT_ID = "00000000402B5328"

SUPABASE_URL = "https://yzzrqkuejstcaegqidbj.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6enJxa3VlanN0Y2FlZ3FpZGJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxMTAzNTcsImV4cCI6MjA5OTY4NjM1N30._bi80RNUo1l0tIIw2L8AMod-zMIh9k4HBEbbpgoG9Jw"

for d in [CONFIG_DIR, DATA_DIR, INSTANCES_DIR, LIBS_DIR, ASSETS_DIR,
          NATIVES_DIR, LOGS_DIR, VERSIONS_DIR, PROFILES_DIR]:
    d.mkdir(parents=True, exist_ok=True)
