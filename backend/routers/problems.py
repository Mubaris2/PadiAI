from fastapi import APIRouter
from ..database import get_conn

router = APIRouter()


@router.get('/')
def list_problems():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute('SELECT id, title, difficulty, content FROM problems')
    rows = cur.fetchall()
    conn.close()
    return [dict(r) for r in rows]


@router.post('/')
def save_problem(payload: dict):
    title = payload.get('title')
    difficulty = payload.get('difficulty')
    content = payload.get('content')
    conn = get_conn()
    cur = conn.cursor()
    cur.execute('INSERT INTO problems (title, difficulty, content) VALUES (?, ?, ?)', (title, difficulty, content))
    conn.commit()
    pid = cur.lastrowid
    conn.close()
    return {'id': pid, 'title': title, 'difficulty': difficulty}
