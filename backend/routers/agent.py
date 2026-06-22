# pyrefly: ignore [missing-import]
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from pathlib import Path
import json
from datetime import datetime
from agents.graph import compiled_graph
from agents.statement_parser import statement_parser_node
from agents.state import AgentState
from config import get_working_dir, get_grok_key
from db_helpers import get_all_stats, upsert_stat

router = APIRouter()

class ParseRequest(BaseModel):
    problemId: str
    workingDir: str
    rawHtml: str | None = None

@router.post("/parse")
async def parse_problem(req: ParseRequest):
    working_dir = req.workingDir
    if not working_dir:
        raise HTTPException(status_code=400, detail="Working directory not set")
    
    problem_path = Path(working_dir) / req.problemId / "problem.json"
    if not problem_path.exists():
        raise HTTPException(status_code=404, detail="problem.json not found")
    
    problem_json = json.loads(problem_path.read_text())
    
    if req.rawHtml:
        problem_json["rawHtml"] = req.rawHtml

    api_key = get_grok_key()
    if not api_key:
        raise HTTPException(status_code=400, detail="Grok API key not configured")
    
    initial_state: AgentState = {
        "problemId": req.problemId,
        "problemJson": problem_json,
        "llmSummary": problem_json.get("llmSummary", ""),
        "currentCode": "",
        "lastTestResults": [],
        "userStats": get_all_stats(),
        "prevApproaches": problem_json.get("prevApproaches", []),
        "messages": [],
        "userMessage": "",
        "targetAgent": "statement_parser",
        "agentResponse": None,
        "workingDir": working_dir,
    }
    
    # Call statement_parser_node directly since it's a standalone task
    # (running through compiled_graph always triggers the supervisor entry point)
    result = statement_parser_node(initial_state)
    
    return {
        "success": True,
        "problemId": req.problemId,
        "llmSummary": result.get("llmSummary", ""),
        "problemJson": result.get("problemJson", {}),
    }

class ChatRequest(BaseModel):
    problemId: str | None = None
    workingDir: str | None = None
    userMessage: str
    currentCode: str = ""
    lastTestResults: list[dict] = []
    chatHistory: list[dict] = []   # [{role: "user"|"assistant", content: str}]

@router.post("/chat")
async def chat(req: ChatRequest):
    working_dir = req.workingDir
    
    problem_json = {}
    llm_summary = ""
    prev_approaches = []
    
    if req.problemId and working_dir:
        problem_path = Path(working_dir) / req.problemId / "problem.json"
        if problem_path.exists():
            problem_json = json.loads(problem_path.read_text())
            llm_summary = problem_json.get("llmSummary", "")
            prev_approaches = problem_json.get("prevApproaches", [])
    
    user_stats = get_all_stats()
    
    messages = req.chatHistory + [{"role": "user", "content": req.userMessage}]
    
    initial_state: AgentState = {
        "problemId": req.problemId or "",
        "problemJson": problem_json,
        "llmSummary": llm_summary,
        "currentCode": req.currentCode,
        "lastTestResults": req.lastTestResults,
        "userStats": user_stats,
        "prevApproaches": prev_approaches,
        "messages": messages,
        "userMessage": req.userMessage,
        "targetAgent": None,
        "agentResponse": None,
        "workingDir": working_dir or "",
    }
    
    result = await compiled_graph.ainvoke(initial_state)
    
    return {
        "response": result.get("agentResponse") or "I'm not sure how to help with that. Try asking for a hint or your stats.",
        "targetAgent": result.get("targetAgent"),
    }

class TrackTimeRequest(BaseModel):
    problemId: str
    workingDir: str
    seconds: int

@router.post("/track-time")
async def track_time(req: TrackTimeRequest):
    working_dir = req.workingDir
    if not working_dir: return {"success": False}
    problem_path = Path(working_dir) / req.problemId / "problem.json"
    
    if problem_path.exists():
        problem_json = json.loads(problem_path.read_text())
        problem_json["timeSpent"] = problem_json.get("timeSpent", 0) + req.seconds
        problem_path.write_text(json.dumps(problem_json, indent=2))
        
        for tag in problem_json.get("tags", []):
            upsert_stat(tag, timeSpent=req.seconds)
    
    return { "success": True }

class MarkSolvedRequest(BaseModel):
    problemId: str
    workingDir: str

@router.post("/mark-solved")
async def mark_solved(req: MarkSolvedRequest):
    working_dir = req.workingDir
    if not working_dir: return {"success": False}
    problem_path = Path(working_dir) / req.problemId / "problem.json"
    if not problem_path.exists(): return {"success": False}
    
    problem_json = json.loads(problem_path.read_text())
    problem_json["solvedAt"] = int(datetime.now().timestamp())
    problem_path.write_text(json.dumps(problem_json, indent=2))
    
    for tag in problem_json.get("tags", []):
        upsert_stat(tag, solved=1)
    
    return { "success": True }

class MarkAttemptedRequest(BaseModel):
    problemId: str
    workingDir: str

@router.post("/mark-attempted")
async def mark_attempted(req: MarkAttemptedRequest):
    working_dir = req.workingDir
    if not working_dir: return {"success": False}
    problem_path = Path(working_dir) / req.problemId / "problem.json"
    if not problem_path.exists(): return {"success": False}
    
    problem_json = json.loads(problem_path.read_text())
    
    if not problem_json.get("attemptedSession"):
        problem_json["attemptedSession"] = True
        problem_path.write_text(json.dumps(problem_json, indent=2))
        
        for tag in problem_json.get("tags", []):
            upsert_stat(tag, attempted=1)
            
    return { "success": True }
