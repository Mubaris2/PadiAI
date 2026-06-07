from langchain_openai import ChatOpenAI
from config import get_grok_key

def get_llm(temperature: float = 0.3) -> ChatOpenAI:
    api_key = get_grok_key()
    if not api_key:
        raise ValueError("Grok API key not configured. Add it in PadiAI settings.")
    
    return ChatOpenAI(
        model="grok-3-mini",
        api_key=api_key,
        base_url="https://api.x.ai/v1",
        temperature=temperature,
    )
