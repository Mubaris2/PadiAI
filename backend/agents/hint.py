import json
from pathlib import Path
from datetime import datetime
from agents.state import AgentState
from llm import get_llm
from db_helpers import upsert_stat

TIER1_KEYWORDS = ["hint", "nudge", "clue", "tip", "direction", "stuck", "lost"]
TIER2_KEYWORDS = ["algorithm", "approach", "how to solve", "what to use", "technique", "method"]
TIER3_KEYWORDS = ["solution", "answer", "give up", "full", "show me", "code it", "write it"]

def detect_tier(message: str) -> int:
    msg = message.lower()
    if any(k in msg for k in TIER3_KEYWORDS):
        return 3
    if any(k in msg for k in TIER2_KEYWORDS):
        return 2
    return 1

HINT_SYSTEM_T1 = """
You are a competitive programming mentor giving a gentle nudge.
Do NOT reveal the algorithm or solution approach.
Give a 2-3 sentence hint that guides the user's thinking without spoiling.
Focus on what property of the problem to think about.
Avoid previous approaches the user has already tried.
"""

HINT_SYSTEM_T2 = """
You are a competitive programming mentor giving an algorithmic hint.
Reveal the general algorithm or technique needed (e.g. "This can be solved with binary search on the answer").
Explain WHY this approach fits the constraints.
Do NOT write any code. Do NOT give the full solution.
Mention time/space complexity of the approach.
Avoid approaches the user has already tried.
"""

HINT_SYSTEM_T3 = """
You are a competitive programming mentor providing the full solution.
Provide:
1. Complete explanation of the approach
2. Step by step algorithm
3. Complete working C++ code
4. Time and space complexity analysis
Be thorough. This is the last resort for the user.
"""

TIER_PROMPTS = { 1: HINT_SYSTEM_T1, 2: HINT_SYSTEM_T2, 3: HINT_SYSTEM_T3 }

HINT_USER_TEMPLATE = """
Problem Summary:
{llm_summary}

User's previous approaches:
{prev_approaches}

Hints already given this session:
{hints_used}

User's weak topics (for context):
{weak_topics}

User's question: {user_message}
"""

def hint_node(state: AgentState) -> AgentState:
    message = state["userMessage"]
    tier = detect_tier(message)
    
    llm = get_llm(temperature=0.4)
    
    # Build weak topics summary from user stats
    stats = state.get("userStats", [])
    problem_tags = state["problemJson"].get("tags", [])
    relevant_stats = [s for s in stats if s["tag"] in problem_tags]
    weak_topics = [
        s["tag"] for s in relevant_stats
        if s["attempted"] > 0 and (s["solved"] / s["attempted"]) < 0.5
    ]
    
    hints_used = state["problemJson"].get("hintsUsed", [])
    prev_approaches = state.get("prevApproaches", [])
    
    # Update prev_approaches if this is the first hint and message is descriptive
    working_dir = state["workingDir"]
    problem_id = state["problemId"]
    problem_path = Path(working_dir) / problem_id / "problem.json"
    problem_json = state["problemJson"].copy()

    if not hints_used and len(message.split()) > 10:
        approach_entry = {
            "summary": message[:200],  # truncate to 200 chars
            "timestamp": int(datetime.now().timestamp()),
            "source": "hint_request",
        }
        prev_approaches = prev_approaches + [approach_entry]
        problem_json["prevApproaches"] = prev_approaches

    user_content = HINT_USER_TEMPLATE.format(
        llm_summary=state.get("llmSummary", "No summary available"),
        prev_approaches=json.dumps(prev_approaches) if prev_approaches else "None yet",
        hints_used=json.dumps(hints_used) if hints_used else "None yet",
        weak_topics=", ".join(weak_topics) if weak_topics else "None identified",
        user_message=message,
    )
    
    response = llm.invoke([
        {"role": "system", "content": TIER_PROMPTS[tier]},
        {"role": "user", "content": user_content},
    ])
    
    agent_response = response.content
    
    # Record hint usage in problem.json
    hints_used_updated = hints_used + [{
        "tier": tier,
        "timestamp": int(datetime.now().timestamp()),
        "userMessage": message,
    }]
    
    updated_problem = { **problem_json, "hintsUsed": hints_used_updated }
    problem_path.write_text(json.dumps(updated_problem, indent=2))
    
    # Update SQLite: increment hintsUsed for each problem tag
    for tag in problem_json.get("tags", []):
        upsert_stat(tag, hintsUsed=1)
    
    return {
        **state,
        "agentResponse": agent_response,
        "problemJson": updated_problem,
        "prevApproaches": prev_approaches,
    }
