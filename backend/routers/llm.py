from fastapi import APIRouter
from ..models import LLMRequest, LLMResponse

router = APIRouter()


@router.post('/hint', response_model=LLMResponse)
def hint(req: LLMRequest):
    # Stubbed hint response — real LLM integration will be added later
    return LLMResponse(hint=f"(stub) Hint for problem {req.problem_id or 'unknown'} at level {req.hint_level}")


@router.post('/interrupt', response_model=LLMResponse)
def interrupt(req: LLMRequest):
    # Return a stubbed interrupt suggestion
    return LLMResponse(detail="(stub) Interrupt: please save your work before continuing.")
