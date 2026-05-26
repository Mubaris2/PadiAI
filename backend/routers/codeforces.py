from fastapi import APIRouter
import httpx
import os
import json
import asyncio
from pathlib import Path

router = APIRouter()

CF_API_URL = "https://codeforces.com/api/problemset.problems"
DEFAULT_CPP_TEMPLATE = """#include <bits/stdc++.h>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    
    // your code here
    
    return 0;
}
"""

@router.get("/search")
async def search_problem(contest_id: int, index: str):
    """Search for a problem by contest ID and index"""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(CF_API_URL)
            resp.raise_for_status()
            data = resp.json()
        
        problems = data.get("result", {}).get("problems", [])
        stats = {
            f"{s['contestId']}{s['index']}": s.get("solvedCount", 0)
            for s in data.get("result", {}).get("problemStatistics", [])
        }
        
        matched = [
            p for p in problems
            if p.get("contestId") == contest_id and p.get("index").upper() == index.upper()
        ]
        
        results = []
        for p in matched:
            key = f"{p['contestId']}{p['index']}"
            results.append({
                "id": key,
                "contestId": p["contestId"],
                "index": p["index"],
                "title": p.get("title", ""),
                "rating": p.get("rating"),
                "tags": p.get("tags", []),
                "solvedCount": stats.get(key, 0),
            })
        
        return {"results": results}
    except Exception as e:
        return {"results": [], "error": str(e)}

@router.post("/import")
async def import_problems(payload: dict):
    """Import problems from Codeforces"""
    try:
        problems = payload.get("problems", [])
        working_dir = payload.get("workingDir", "")
        
        if not working_dir or not os.path.isdir(working_dir):
            return {"imported": [], "errors": [f"Invalid working directory: {working_dir}"]}
        
        # Fetch all problems from CF API once
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(CF_API_URL)
            resp.raise_for_status()
            cf_data = resp.json()
        
        all_problems = {
            f"{p['contestId']}{p['index']}": p
            for p in cf_data.get("result", {}).get("problems", [])
        }
        
        imported = []
        errors = []
        
        for prob in problems:
            contest_id = prob.get("contestId")
            index = prob.get("index")
            
            if not contest_id or not index:
                errors.append(f"Invalid problem data: {prob}")
                continue
            
            problem_id = f"{contest_id}{index}"
            cf_problem = all_problems.get(problem_id)
            
            if not cf_problem:
                errors.append(f"Problem {problem_id} not found on Codeforces")
                continue
            
            # Create problem directory
            problem_dir = os.path.join(working_dir, problem_id)
            os.makedirs(problem_dir, exist_ok=True)
            
            # Write problem.json
            problem_json = {
                "id": problem_id,
                "contestId": contest_id,
                "index": index,
                "title": cf_problem.get("title", ""),
                "rating": cf_problem.get("rating"),
                "tags": cf_problem.get("tags", []),
                "url": f"https://codeforces.com/problemset/problem/{contest_id}/{index}",
                "statement": "",
                "statementPlaceholder": True,
                "constraints": "",
                "examples": [],
                "others": ""
            }
            
            with open(os.path.join(problem_dir, "problem.json"), "w") as f:
                json.dump(problem_json, f, indent=2)
            
            # Write testcases.json (empty)
            with open(os.path.join(problem_dir, "testcases.json"), "w") as f:
                json.dump([], f)
            
            # Write solution.cpp if it doesn't exist
            solution_path = os.path.join(problem_dir, "solution.cpp")
            if not os.path.exists(solution_path):
                with open(solution_path, "w") as f:
                    f.write(DEFAULT_CPP_TEMPLATE)
            
            imported.append(problem_id)
        
        return {"imported": imported, "errors": errors}
    except Exception as e:
        return {"imported": [], "errors": [str(e)]}
