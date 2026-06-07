from langgraph.graph import StateGraph, END
from agents.state import AgentState
from agents.statement_parser import statement_parser_node

def build_graph() -> StateGraph:
    graph = StateGraph(AgentState)
    
    # Phase 3a: only statement parser node
    graph.add_node("statement_parser", statement_parser_node)
    
    # Entry and exit
    graph.set_entry_point("statement_parser")
    graph.add_edge("statement_parser", END)
    
    return graph.compile()

compiled_graph = build_graph()
