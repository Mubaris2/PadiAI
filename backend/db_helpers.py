from database import get_connection

# user_stats
def get_all_stats() -> list[dict]:
    conn = get_connection()
    rows = conn.execute("SELECT * FROM user_stats").fetchall()
    conn.close()
    return [dict(r) for r in rows]

def upsert_stat(tag: str, attempted=0, solved=0, timeSpent=0, hintsUsed=0):
    conn = get_connection()
    conn.execute("""
        INSERT INTO user_stats (tag, attempted, solved, timeSpent, hintsUsed)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(tag) DO UPDATE SET
            attempted  = attempted  + excluded.attempted,
            solved     = solved     + excluded.solved,
            timeSpent  = timeSpent  + excluded.timeSpent,
            hintsUsed  = hintsUsed  + excluded.hintsUsed
    """, (tag, attempted, solved, timeSpent, hintsUsed))
    conn.commit()
    conn.close()

# settings
def get_setting(key: str) -> str | None:
    conn = get_connection()
    row = conn.execute("SELECT value FROM settings WHERE key=?", (key,)).fetchone()
    conn.close()
    return row["value"] if row else None

def set_setting(key: str, value: str):
    conn = get_connection()
    conn.execute("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", (key, value))
    conn.commit()
    conn.close()
