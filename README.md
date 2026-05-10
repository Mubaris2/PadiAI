# Agentic_CPH — Local Dev Run

Prereqs:
- Node.js (16+)
- Python 3.8+ (for backend)

Install frontend deps:
```bash
npm install
```

Install backend deps:
```bash
python -m pip install -r backend/requirements.txt
```

Run in development (starts Vite, then Electron):
```bash
npm run dev
```

Alternatively start services manually:
1. Start backend (FastAPI):
```bash
cd backend
uvicorn main:app --reload --port 8000
```
2. Start renderer dev server:
```bash
npm run dev:renderer
```
3. Start Electron (after vite is up):
```bash
npm run dev:electron
```

Notes:
- The Electron main process spawns the FastAPI backend when the app starts (dev mode expects `uvicorn` available).
- Renderer calls to backend go through Electron IPC handlers exposed in `electron/preload.js`.
v2