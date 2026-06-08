from agents.state import AgentState

STATS_SYSTEM = """
You are a competitive programming coach analyzing a user's performance data.
Given their topic-level statistics, provide:
1. Their strongest topics (high solve rate)
2. Their weakest topics (low solve rate or high time spent)
3. Specific actionable advice on what to practice next
4. Encouragement based on their progress

Be concise. Max 200 words. Use a friendly, coach-like tone.
Do not just list numbers. Give insight and direction.
"""

STATS_USER_TEMPLATE = """
User's topic statistics:
{stats_table}

User's question: {user_message}
"""

def format_stats_table(stats: list[dict]) -> str:
    if not stats:
        return "No data yet. User has not solved any problems."
    
    lines = ["Tag | Attempted | Solved | Time Spent (min) | Hints Used"]
    lines.append("-" * 60)
    for s in sorted(stats, key=lambda x: x["attempted"], reverse=True):
        time_min = s["timeSpent"] // 60
        solve_rate = f"{(s['solved']/s['attempted']*100):.0f}%" if s["attempted"] else "0%"
        lines.append(
            f"{s['tag']} | {s['attempted']} | {s['solved']} ({solve_rate}) | {time_min} | {s['hintsUsed']}"
        )
    return "\n".join(lines)

def stats_node(state: AgentState) -> AgentState:
    from llm import get_llm
    llm = get_llm(temperature=0.5)
    
    stats_table = format_stats_table(state.get("userStats", []))
    
    user_content = STATS_USER_TEMPLATE.format(
        stats_table=stats_table,
        user_message=state["userMessage"],
    )
    
    response = llm.invoke([
        {"role": "system", "content": STATS_SYSTEM},
        {"role": "user", "content": user_content},
    ])
    
    return {
        **state,
        "agentResponse": response.content,
    }
