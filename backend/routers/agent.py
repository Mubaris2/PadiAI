from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from pathlib import Path
import json
from agents.graph import compiled_graph
from agents.state import AgentState
from config import get_working_dir, get_grok_key
from db_helpers import get_all_stats

router = APIRouter()

class ParseRequest(BaseModel):
    problemId: str

@router.post("/parse")
async def parse_problem(req: ParseRequest):
    working_dir = get_working_dir()
    if not working_dir:
        raise HTTPException(status_code=400, detail="Working directory not set")
    
    problem_path = Path(working_dir) / req.problemId / "problem.json"
    if not problem_path.exists():
        raise HTTPException(status_code=404, detail="problem.json not found")
    
    problem_json = json.loads(problem_path.read_text())
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
    
    result = await compiled_graph.ainvoke(initial_state)
    
    return {
        "success": True,
        "problemId": req.problemId,
        "llmSummary": result["llmSummary"],
    }
