from typing import Literal, Any
from pydantic import BaseModel, Field

class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=8000)
    conversation_id: str | None = None
    mode: Literal["friend", "teacher", "doing"] = "teacher"
    user_id: str | None = "guest"

class Citation(BaseModel):
    document_name: str
    page: int
    excerpt: str

class WorkflowEvent(BaseModel):
    label: str
    state: Literal["complete", "active"] = "complete"

class Message(BaseModel):
    id: str
    role: Literal["assistant", "user"] = "assistant"
    content: str
    citations: list[Citation] = []
    visual_spec: dict[str, Any] | None = None
    events: list[WorkflowEvent] = []
    created_at: str | None = None

class ChatResponse(BaseModel):
    conversation_id: str
    message: Message
    events: list[WorkflowEvent]

class AssessmentCreate(BaseModel):
    topic: str = Field(min_length=2, max_length=120)

class AssessmentSubmit(BaseModel):
    answers: list[str] = Field(min_length=1, max_length=10)

class StudyPlanCreate(BaseModel):
    exam_date: str
    daily_minutes: int = Field(ge=15, le=720)
    subjects: list[str] = Field(min_length=1, max_length=12)
    priorities: str | None = None

class PlanPatch(BaseModel):
    completed_sessions: list[int] = []

class VoiceSynthesizeRequest(BaseModel):
    text: str = Field(min_length=1, max_length=5000)
    mode: str = "teacher"
    speed: float = 1.0

class UserRegister(BaseModel):
    email: str
    password: str
    name: str

class UserLogin(BaseModel):
    email: str
    password: str
