from fastapi import APIRouter
from ..database import get_conn

router = APIRouter()


@router.get('/')
def list_users():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute('SELECT id, name FROM users')
    rows = cur.fetchall()
    conn.close()
    return [dict(r) for r in rows]


@router.post('/')
def create_user(payload: dict):
    name = payload.get('name')
    conn = get_conn()
    cur = conn.cursor()
    cur.execute('INSERT INTO users (name) VALUES (?)', (name,))
    conn.commit()
    uid = cur.lastrowid
    conn.close()
    return {'id': uid, 'name': name}
