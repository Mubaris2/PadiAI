from fastapi import APIRouter
from ..database import get_conn

router = APIRouter()


@router.get('/')
def get_settings():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute('SELECT api_key, prefs FROM settings WHERE id = 1')
    row = cur.fetchone()
    conn.close()
    if not row:
        return {'api_key': None, 'prefs': None}
    return {'api_key': row['api_key'], 'prefs': row['prefs']}


@router.post('/')
def save_settings(payload: dict):
    api_key = payload.get('api_key')
    prefs = payload.get('prefs')
    conn = get_conn()
    cur = conn.cursor()
    cur.execute('INSERT OR REPLACE INTO settings (id, api_key, prefs) VALUES (1, ?, ?)', (api_key, prefs))
    conn.commit()
    conn.close()
    return {'api_key': api_key, 'prefs': prefs}
