import json
from pathlib import Path

CONFIG_PATH = Path.home() / ".padiai" / "config.json"

def read_config() -> dict:
    try:
        return json.loads(CONFIG_PATH.read_text())
    except:
        return {}

def get_grok_key() -> str | None:
    return read_config().get("grokApiKey")

def get_working_dir() -> str | None:
    return read_config().get("workingDir")
