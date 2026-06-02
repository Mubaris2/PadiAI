from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import codeforces, execution

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)
app.include_router(codeforces.router, prefix="/cf")
app.include_router(execution.router, prefix="/execute")

@app.get("/health")
async def health():
    return {"status": "ok"}
