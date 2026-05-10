from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import llm, users, problems, settings
from . import database

app = FastAPI(title="Agentic_CPH Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup():
    database.init_db()


app.include_router(llm.router, prefix="/llm")
app.include_router(users.router, prefix="/users")
app.include_router(problems.router, prefix="/problems")
app.include_router(settings.router, prefix="/settings")
