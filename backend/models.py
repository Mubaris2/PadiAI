from pydantic import BaseModel
from typing import Optional


class LLMRequest(BaseModel):
    code: str
    problem_id: Optional[int] = None
    hint_level: Optional[int] = 1


class LLMResponse(BaseModel):
    hint: Optional[str] = None
    detail: Optional[str] = None


class UserIn(BaseModel):
    name: str


class UserOut(BaseModel):
    id: int
    name: str


class ProblemIn(BaseModel):
    title: str
    difficulty: Optional[str] = None
    content: Optional[str] = None


class ProblemOut(ProblemIn):
    id: int


class SettingsIn(BaseModel):
    api_key: Optional[str] = None
    prefs: Optional[dict] = None


class SettingsOut(BaseModel):
    api_key: Optional[str] = None
    prefs: Optional[dict] = None
