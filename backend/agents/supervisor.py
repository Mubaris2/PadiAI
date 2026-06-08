from agents.state import AgentState
from llm import get_llm
from langgraph.graph import END

HINT_KEYWORDS = [
    "hint", "help", "stuck", "approach", "idea", "suggest",
    "how to", "what should", "can you help", "don't know",
    "lost", "clue", "direction", "nudge", "tip"
]

STATS_KEYWORDS = [
    "stats", "statistics", "progress", "weakness", "weak",
    "improve", "performance", "how am i", "my level",
    "rating", "topics", "strong", "strength", "history"
]

def keyword_route(message: str) -> str | None:
    msg = message.lower()
    if any(k in msg for k in HINT_KEYWORDS):
        return "hint"
    if any(k in msg for k in STATS_KEYWORDS):
        return "stats"
    return None

SUPERVISOR_SYSTEM = """
You are a routing agent for a competitive programming assistant.
Given the user's message and context, decide which agent should handle it.

Agents available:
- hint: User needs help with the current problem (approach, algorithm, code review, explanation)
- stats: User is asking about their performance, progress, weak topics, or improvement areas
- none: General conversation, greetings, unclear intent

Respond with ONLY one word: hint, stats, or none.
"""

def llm_route(message: str, llm_summary: str, llm) -> str:
    response = llm.invoke([
        {"role": "system", "content": SUPERVISOR_SYSTEM},
        {"role": "user", "content": f"Problem context: {llm_summary}\n\nUser message: {message}"}
    ])
    result = response.content.strip().lower()
    return result if result in ("hint", "stats") else END

def supervisor_node(state: AgentState) -> AgentState:
    message = state["userMessage"]
    
    # Fast path: keyword routing
    route = keyword_route(message)
    
    if route is None:
        # LLM fallback
        llm = get_llm(temperature=0)
        route = llm_route(message, state.get("llmSummary", ""), llm)
    
    return {
        **state,
        "targetAgent": route,
    }
