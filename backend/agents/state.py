from typing import TypedDict, Optional, Any

class AgentState(TypedDict):
    # Problem context
    problemId: str                    # e.g. "1234A"
    problemJson: dict                 # full problem.json content
    llmSummary: str                   # compressed summary for agents
    currentCode: str                  # current editor content
    lastTestResults: list[dict]       # last execution results
    
    # User context
    userStats: list[dict]             # from SQLite user_stats
    prevApproaches: list[dict]        # from problem.json
    
    # Conversation
    messages: list[dict]              # chat history: [{role, content}]
    userMessage: str                  # latest user input
    
    # Routing
    targetAgent: Optional[str]        # set by supervisor
    agentResponse: Optional[str]      # final response to send to UI
    
    # Internal
    workingDir: str
