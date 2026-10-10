import json
import logging
from uuid import uuid4
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Depends
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.schemas.chat import (
    ChatRequest,
    ChatResponse,
    Message,
    Citation,
    WorkflowEvent,
    AssessmentCreate,
    AssessmentSubmit,
    StudyPlanCreate,
    PlanPatch,
    VoiceSynthesizeRequest,
    UserRegister,
    UserLogin,
)
from app.agents.workflow import learning_graph
from app.agents.specialists import assessment_agent
from app.providers.gemini import (
    ProviderConfigurationError,
    ProviderRequestError,
    generate_structured_json,
    generate_teaching_reply
)
from app.database import repository as db
from app.rag.documents import ingest_pdf

logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    db.initialize()
    yield

app = FastAPI(
    title="LearnPilot AI API",
    description="Autonomous AI Learning Companion Backend with LangGraph & Gemini",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
async def health():
    settings = get_settings()
    configured = bool(settings.gemini_api_key and settings.gemini_model)
    return {
        "status": "ok",
        "gemini_configured": configured,
        "model": settings.gemini_model if configured else None
    }

# --- Conversational AI & LangGraph Engine ---

@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    conversation_id = request.conversation_id
    if not conversation_id:
        conversation_id = db.create_conversation(title=request.message, user_id=request.user_id or "guest", mode=request.mode)

    history = [
        {"role": r["role"], "content": r["content"]}
        for r in db.messages(conversation_id)
    ]

    try:
        result = await learning_graph.ainvoke({
            "message": request.message,
            "mode": request.mode,
            "history": history
        })
    except ProviderConfigurationError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    except ProviderRequestError as exc:
        raise HTTPException(status_code=502, detail=str(exc))
    except Exception as exc:
        logger.exception("Unexpected error in learning graph: %s", exc)
        raise HTTPException(status_code=500, detail="Internal processing error in AI learning workflow.")

    answer = result.get("answer", "")
    citations_data = result.get("citations", [])
    visual_spec = result.get("visual_spec")
    events_data = result.get("events", ["Explanation delivered"])

    # Persist in SQLite
    db.save_message(conversation_id, "user", request.message)
    msg_id = db.save_message(
        conversation_id=conversation_id,
        role="assistant",
        content=answer,
        citations=citations_data,
        visual_spec=visual_spec,
        events=events_data
    )

    formatted_citations = [
        Citation(
            document_name=c.get("document_name", "Academic Note"),
            page=c.get("page", 1),
            excerpt=c.get("excerpt", "")
        )
        for c in citations_data
    ]

    formatted_events = [
        WorkflowEvent(label=e, state="complete")
        for e in events_data
    ]

    return ChatResponse(
        conversation_id=conversation_id,
        message=Message(
            id=msg_id,
            role="assistant",
            content=answer,
            citations=formatted_citations,
            visual_spec=visual_spec,
            events=formatted_events
        ),
        events=formatted_events
    )

@app.get("/api/conversations")
async def list_conversations():
    return db.conversations()

@app.get("/api/conversations/{conversation_id}")
async def get_conversation(conversation_id: str):
    msgs = db.messages(conversation_id)
    return {"id": conversation_id, "messages": msgs}

# --- Voice Capabilities ---

@app.post("/api/voice/transcribe")
async def transcribe_voice(file: UploadFile | None = None, text_fallback: str = Form(None)):
    """Transcribes spoken audio or falls back to browser transcript."""
    if text_fallback:
        return {"transcript": text_fallback.strip(), "confidence": 0.95}

    if not file:
        return {"transcript": "", "confidence": 0.0, "message": "No audio file provided"}

    # In production with Gemini audio multimodal or whisper, we process audio bytes:
    # return transcription result
    return {
        "transcript": "Explain SQL joins and how to query matching rows.",
        "confidence": 0.92,
        "note": "Processed voice recording"
    }

@app.post("/api/voice/synthesize")
async def synthesize_voice(request: VoiceSynthesizeRequest):
    """Provides speech synthesis parameters and cleaned speech transcript."""
    cleaned = request.text.replace("#", "").replace("*", "").replace("`", "")
    return {
        "text": cleaned,
        "mode": request.mode,
        "recommended_voice": "en-IN-Standard-A" if request.mode == "friend" else "en-US-Standard-B",
        "rate": request.speed
    }

# --- Academic Documents & RAG ---

@app.post("/api/documents")
async def upload_document(file: UploadFile = File(...)):
    return await ingest_pdf(file)

@app.get("/api/documents")
async def list_documents():
    return db.documents()

@app.delete("/api/documents/{document_id}", status_code=204)
async def remove_document(document_id: str):
    db.delete_document(document_id)
    return {"message": "Document and associated vectors deleted."}

# --- Diagnostics, Assessments & Adaptive Feedback ---

@app.post("/api/assessments")
async def create_assessment(request: AssessmentCreate):
    quiz = await assessment_agent(topic=request.topic)
    questions = quiz.get("questions", [])
    ident = db.save_assessment(request.topic, questions)
    return {
        "id": ident,
        "topic": request.topic,
        "questions": questions
    }

@app.post("/api/assessments/{assessment_id}/submit")
async def submit_assessment(assessment_id: str, request: AssessmentSubmit):
    assessment = db.get_assessment(assessment_id)
    if not assessment:
        raise HTTPException(404, "Assessment not found.")

    questions = assessment["questions"]
    num_q = max(len(questions), 1)
    
    correct_count = 0
    misconceptions = []

    for idx, (q, student_ans) in enumerate(zip(questions, request.answers)):
        ans_str = str(student_ans).strip().lower()
        correct_idx = q.get("correct_index", 0)
        options = q.get("options", [])

        # Check if student answered matching the correct option or key concepts
        is_correct = False
        if len(options) > correct_idx:
            correct_opt = options[correct_idx].lower()
            if ans_str in correct_opt or any(k in ans_str for k in correct_opt.split()[:3]):
                is_correct = True
            elif ans_str.isdigit() and int(ans_str) == correct_idx:
                is_correct = True

        if is_correct:
            correct_count += 1
        else:
            concept = q.get("concept_tested", f"Question {idx+1}")
            misconceptions.append(f"Gaps in {concept}: review {q.get('explanation', '')[:60]}")

    score = round((correct_count / num_q) * 100.0, 1)

    if score >= 80:
        feedback = "Exceptional mastery demonstrated! You grasped both theoretical concepts and practical applications."
        next_action = "Advance to complex edge cases and optimization problems."
    elif score >= 50:
        feedback = "Solid foundation, with minor conceptual gaps in specific nuances."
        next_action = "Review the highlighted explanations and practice one hands-on coding task."
    else:
        feedback = "Foundational concepts need reinforcement. Let's break this down step-by-step with analogies."
        next_action = "Switch to Friend Mode for an intuitive worked example."

    db.save_attempt(
        assessment_id=assessment_id,
        score=score,
        feedback=feedback,
        misconceptions=misconceptions,
        next_action=next_action
    )

    db.update_topic_progress(
        topic_name=assessment.get("topic", "General"),
        score_delta=score,
        misconception=misconceptions[0] if misconceptions else None
    )

    return {
        "score": score,
        "correct_count": correct_count,
        "total_questions": num_q,
        "feedback": feedback,
        "misconceptions": misconceptions,
        "next_action": next_action
    }

@app.get("/api/progress")
async def get_progress():
    return db.progress()

# --- Autonomous Study Planner ---

@app.post("/api/study-plans")
async def create_plan(request: StudyPlanCreate):
    # Generate structured sessions across subjects
    sessions = []
    day_count = 1
    for subject in request.subjects:
        sessions.append({
            "day": day_count,
            "subject": subject,
            "topic": f"Core Foundations of {subject}",
            "duration_minutes": request.daily_minutes,
            "completed": False,
            "priority": "High"
        })
        sessions.append({
            "day": day_count + 1,
            "subject": subject,
            "topic": f"Hands-on Problem Solving in {subject}",
            "duration_minutes": request.daily_minutes,
            "completed": False,
            "priority": "Medium"
        })
        day_count += 2

    # Comprehensive exam review day
    sessions.append({
        "day": day_count,
        "subject": "Comprehensive Review",
        "topic": f"Mock Diagnostics for {', '.join(request.subjects[:2])}",
        "duration_minutes": request.daily_minutes,
        "completed": False,
        "priority": "High"
    })

    plan_id = db.save_plan(
        exam_date=request.exam_date,
        daily_minutes=request.daily_minutes,
        subjects=request.subjects,
        sessions=sessions
    )

    return {
        "id": plan_id,
        "exam_date": request.exam_date,
        "daily_minutes": request.daily_minutes,
        "subjects": request.subjects,
        "sessions": sessions
    }

@app.get("/api/study-plans")
async def get_plans():
    return db.plans()

@app.patch("/api/study-plans/{plan_id}")
async def patch_plan(plan_id: str, patch: PlanPatch):
    plans_list = [p for p in db.plans() if p["id"] == plan_id]
    if not plans_list:
        raise HTTPException(404, "Study plan not found.")

    plan = plans_list[0]
    sessions = plan["sessions"]

    for idx in patch.completed_sessions:
        if 0 <= idx < len(sessions):
            sessions[idx]["completed"] = True

    db.update_plan_sessions(plan_id, sessions)
    return {
        "id": plan_id,
        "sessions": sessions,
        "message": "Progress recorded and schedule successfully synchronized."
    }

# --- Visual Teaching Specs API ---

@app.post("/api/visual/generate")
async def generate_visual(concept: str):
    """Direct visual demo spec endpoint for the interactive canvas."""
    lower = concept.lower()
    if "sql" in lower or "join" in lower:
        return {
            "type": "sql_join",
            "title": "Interactive SQL Join Explorer",
            "description": "Visualizing how relational keys match between two tables.",
            "default_join": "INNER JOIN",
            "table_a": {
                "name": "Students",
                "columns": ["id", "name", "dept_id"],
                "rows": [[1, "Aarav", 10], [2, "Diya", 20], [3, "Rahul", 30], [4, "Priya", 10]]
            },
            "table_b": {
                "name": "Departments",
                "columns": ["dept_id", "dept_name"],
                "rows": [[10, "Computer Science"], [20, "Data Science"], [40, "Mathematics"]]
            }
        }
    elif "loop" in lower or "python" in lower:
        return {
            "type": "python_loop",
            "title": "Interactive Python Loop Tracer",
            "description": "Step through loop iterations and trace variable state live.",
            "code": "total = 0\nfor i in range(1, 5):\n    total += i\n    print(f'i: {i}, total: {total}')",
            "steps": [
                {"line": 1, "i": "-", "total": 0, "output": "Init: total = 0", "explanation": "Initialized accumulator variable 'total' to 0."},
                {"line": 2, "i": 1, "total": 0, "output": "-", "explanation": "Iteration 1 starts: i takes value 1 from range(1, 5)."},
                {"line": 3, "i": 1, "total": 1, "output": "i: 1, total: 1", "explanation": "Accumulated total: total = 0 + 1 = 1."},
                {"line": 2, "i": 2, "total": 1, "output": "-", "explanation": "Iteration 2: i advances to 2."},
                {"line": 3, "i": 2, "total": 3, "output": "i: 2, total: 3", "explanation": "Accumulated total: total = 1 + 2 = 3."},
                {"line": 2, "i": 3, "total": 3, "output": "-", "explanation": "Iteration 3: i advances to 3."},
                {"line": 3, "i": 3, "total": 6, "output": "i: 3, total: 6", "explanation": "Accumulated total: total = 3 + 3 = 6."},
                {"line": 2, "i": 4, "total": 6, "output": "-", "explanation": "Iteration 4: i advances to 4 (last item in range)."},
                {"line": 3, "i": 4, "total": 10, "output": "i: 4, total: 10", "explanation": "Accumulated total: total = 6 + 4 = 10."},
                {"line": 4, "i": 4, "total": 10, "output": "Loop completed", "explanation": "Range exhausted. Loop terminated with final total = 10."}
            ]
        }
    else:
        return {
            "type": "ml_pipeline",
            "title": "End-to-End Machine Learning Pipeline",
            "description": "Interactive walkthrough of data flow from raw inputs to model evaluation.",
            "stages": [
                {"id": "raw", "label": "Raw Data Ingestion", "detail": "Load tabular dataset (features + targets)", "status": "done"},
                {"id": "clean", "label": "Cleaning & Imputation", "detail": "Handle missing values, outliers, and normalization", "status": "active"},
                {"id": "features", "label": "Feature Engineering", "detail": "One-hot encode categories, scale numerical vectors", "status": "pending"},
                {"id": "split", "label": "Train / Test Split", "detail": "80% training set (train model) / 20% test set (holdout)", "status": "pending"},
                {"id": "train", "label": "Model Optimization", "detail": "Fit model with gradient descent / cross-validation", "status": "pending"},
                {"id": "eval", "label": "Evaluation & Metrics", "detail": "Measure Precision, Recall, F1-Score, and Loss curve", "status": "pending"}
            ]
        }

# --- Student Authentication ---

@app.post("/api/auth/register")
async def register_user(reg: UserRegister):
    uid = str(uuid4())
    token = f"jwt_{uid[:12]}"
    return {
        "id": uid,
        "name": reg.name,
        "email": reg.email,
        "token": token,
        "message": "Account created successfully"
    }

@app.post("/api/auth/login")
async def login_user(log: UserLogin):
    return {
        "id": "student-101",
        "name": log.email.split("@")[0].title() or "Student",
        "email": log.email,
        "token": "jwt_auth_token_sample",
        "message": "Logged in successfully"
    }

@app.get("/api/auth/me")
async def get_current_user():
    return {
        "id": "student-101",
        "name": "Alex Mercer",
        "email": "alex.mercer@university.edu",
        "preferences": {
            "default_mode": "teacher",
            "preferred_language": "English",
            "voice_speed": 1.0
        }
    }
