import sqlite3
from pathlib import Path

DB_PATH = Path.home() / ".padiai" / "padiai.db"

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    Path(DB_PATH).parent.mkdir(parents=True, exist_ok=True)
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.executescript("""
        CREATE TABLE IF NOT EXISTS user_stats (
            tag          TEXT PRIMARY KEY,
            attempted    INTEGER DEFAULT 0,
            solved       INTEGER DEFAULT 0,
            timeSpent    INTEGER DEFAULT 0,
            hintsUsed    INTEGER DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS settings (
            key          TEXT PRIMARY KEY,
            value        TEXT
        );
    """)
    
    conn.commit()
    conn.close()
