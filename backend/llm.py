from langchain_openai import ChatOpenAI
from config import get_grok_key

def get_llm(temperature: float = 0.3) -> ChatOpenAI:
    api_key = get_grok_key()
    if not api_key:
        raise ValueError("Grok API key not configured. Add it in PadiAI settings.")
    
    # Automatically route to Groq if the key looks like a Groq key (starts with gsk_)
    if api_key.startswith("gsk_"):
        return ChatOpenAI(
            model="llama-3.3-70b-versatile",
            api_key=api_key,
            base_url="https://api.groq.com/openai/v1",
            temperature=temperature,
        )
    
    # Fallback to x.ai (Grok)
    return ChatOpenAI(
        model="grok-3-mini",
        api_key=api_key,
        base_url="https://api.x.ai/v1",
        temperature=temperature,
    )
