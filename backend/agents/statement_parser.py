import json
import re
from pathlib import Path
from agents.state import AgentState
from llm import get_llm

PARSER_SYSTEM_PROMPT = """
You are a competitive programming problem parser.

You receive raw problem data. Input may be plain text, HTML from a Codeforces page, or mixed format.
Your job is to extract and return a clean structured JSON with exactly these fields. 
IMPORTANT: For text fields (statement, constraints, others), use basic HTML tags for formatting (<p>, <br>, <strong>, <ul>, <li>) so they render beautifully. Do NOT change the original words or sentences, just improve the layout.

- statement: The problem description formatted nicely with <p> and <br> tags. Use <strong> for emphasis if needed. No examples. No constraints. Preserve mathematical notation.
- constraints: All constraints formatted cleanly. Use an HTML unordered list (<ul><li>...</li></ul>) so each constraint is on a separate line. Include time limit and memory limit.
- examples: Array of objects: [{ "input": "...", "output": "...", "note": "..." }].
  Extract ALL examples from the page. Format the 'note' field with basic HTML if present. 'note' is optional, use empty string if not present.
- others: Any remaining content (problem source, special notes, image descriptions). Format nicely with HTML tags.
- llmSummary: Compressed version for AI agents only. Max 150 words. Plain text. Include: what the problem asks, key constraint values, algorithm tags, difficulty rating. No fluff. Dense information only.

Return ONLY valid JSON. No explanation. No markdown wrappers like ```json. No trailing commas.
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
    
    raw_html = problem.get("rawHtml", "")
    raw_source = f"Raw HTML from CF page:\n{raw_html[:8000]}" if raw_html else ""
    
    user_msg = PARSER_USER_TEMPLATE.format(
        problemId=problem.get("id", ""),
        title=problem.get("title", ""),
        rating=problem.get("rating", ""),
        tags=", ".join(problem.get("tags", [])),
        statement=raw_source or problem.get("statement", ""),
        constraints=problem.get("constraints", ""),
        examples=json.dumps(problem.get("examples", [])),
        others=problem.get("others", ""),
    )
    
    response = llm.invoke([
        {"role": "system", "content": PARSER_SYSTEM_PROMPT},
        {"role": "user", "content": user_msg},
    ])
    
    content = response.content.strip()
    
    # Extract JSON block using regex if wrapped in markdown
    match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', content, re.DOTALL)
    if match:
        content = match.group(1).strip()
    else:
        # Fallback: try to find the first { and last }
        start = content.find('{')
        end = content.rfind('}')
        if start != -1 and end != -1 and end > start:
            content = content[start:end+1]

    try:
        parsed = json.loads(content)
    except json.JSONDecodeError:
        # Write the failing content to a debug file in the problem directory
        working_dir = state["workingDir"]
        problem_id = problem["id"]
        debug_path = Path(working_dir) / problem_id / "debug_llm_output.txt"
        debug_path.write_text(content)
        
        print(f"Failed to parse LLM response as JSON. Wrote content to {debug_path}")
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
