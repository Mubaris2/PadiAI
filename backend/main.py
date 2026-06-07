from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import codeforces, execution, agent
from database import init_db

app = FastAPI()

@app.on_event("startup")
async def startup():
    init_db()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)
app.include_router(codeforces.router, prefix="/cf")
app.include_router(execution.router, prefix="/execute")
app.include_router(agent.router, prefix="/agent")

@app.get("/health")
async def health():
    return {"status": "ok"}
