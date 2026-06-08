from langgraph.graph import StateGraph, END
from agents.state import AgentState
from agents.statement_parser import statement_parser_node
from agents.supervisor import supervisor_node
from agents.hint import hint_node
from agents.stats import stats_node

def route_after_supervisor(state: AgentState) -> str:
    return state.get("targetAgent", END)

def build_graph() -> StateGraph:
    graph = StateGraph(AgentState)
    
    graph.add_node("statement_parser", statement_parser_node)
    graph.add_node("supervisor", supervisor_node)
    graph.add_node("hint", hint_node)
    graph.add_node("stats", stats_node)
    
    # Statement parser: direct in/out (triggered separately)
    graph.add_node("parse_entry", statement_parser_node)
    graph.set_entry_point("supervisor")
    
    # Supervisor routes to sub-agents
    graph.add_conditional_edges(
        "supervisor",
        route_after_supervisor,
        {
            "hint": "hint",
            "stats": "stats",
            END: END,
        }
    )
    
    graph.add_edge("hint", END)
    graph.add_edge("stats", END)
    
    return graph.compile()

compiled_graph = build_graph()
