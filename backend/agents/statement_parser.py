import json
from pathlib import Path
from agents.state import AgentState
from llm import get_llm

PARSER_SYSTEM_PROMPT = """
You are a competitive programming problem parser.

You receive raw problem data which may be unstructured, HTML, plain text, or mixed format.
Your job is to extract and return a clean structured JSON with exactly these fields:

- statement: Clean problem description. Plain text only. No HTML. No examples. No constraints. Just the core problem story and task.
- constraints: All constraints as a plain text list. One per line. E.g. "1 <= n <= 10^5". Include time and memory limits.
- examples: Array of objects: [{ "input": "...", "output": "...", "note": "..." }]. Extract all examples. note is optional.
- others: Any remaining content (images description, additional notes, special cases not in main statement).
- llmSummary: A compressed version for AI agents only. Max 150 words. Include: what the problem asks, key constraints as numbers, topic tags, difficulty rating. No fluff.

Return ONLY valid JSON. No markdown. No explanation. No backticks.
"""

PARSER_USER_TEMPLATE = """
Problem ID: {problemId}
Title: {title}
Rating: {rating}
Tags: {tags}

Raw Statement:
{statement}

Raw Constraints:
{constraints}

Raw Examples:
{examples}

Raw Others:
{others}
"""

def statement_parser_node(state: AgentState) -> AgentState:
    problem = state["problemJson"]
    llm = get_llm(temperature=0.1)
    
    user_msg = PARSER_USER_TEMPLATE.format(
        problemId=problem.get("id", ""),
        title=problem.get("title", ""),
        rating=problem.get("rating", ""),
        tags=", ".join(problem.get("tags", [])),
        statement=problem.get("statement", ""),
        constraints=problem.get("constraints", ""),
        examples=json.dumps(problem.get("examples", [])),
        others=problem.get("others", ""),
    )
    
    response = llm.invoke([
        {"role": "system", "content": PARSER_SYSTEM_PROMPT},
        {"role": "user", "content": user_msg},
    ])
    
    try:
        parsed = json.loads(response.content)
    except json.JSONDecodeError:
        # Fallback: return state unchanged if parse fails
        return state
    
    # Update problem.json in memory
    updated_problem = {
        **problem,
        "statement": parsed.get("statement", problem.get("statement", "")),
        "constraints": parsed.get("constraints", problem.get("constraints", "")),
        "examples": parsed.get("examples", problem.get("examples", [])),
        "others": parsed.get("others", problem.get("others", "")),
        "llmSummary": parsed.get("llmSummary", ""),
        "statementPlaceholder": False,
        "prevApproaches": problem.get("prevApproaches", []),
    }
    
    # Write back to problem.json
    working_dir = state["workingDir"]
    problem_id = problem["id"]
    problem_path = Path(working_dir) / problem_id / "problem.json"
    problem_path.write_text(json.dumps(updated_problem, indent=2))
    
    return {
        **state,
        "problemJson": updated_problem,
        "llmSummary": updated_problem["llmSummary"],
    }
