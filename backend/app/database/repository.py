import json
import sqlite3
import math
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4
from typing import Any
from app.config import get_settings

def now() -> str:
    return datetime.now(timezone.utc).isoformat()

def connection() -> sqlite3.Connection:
    db_path = get_settings().database_path
    Path(db_path).parent.mkdir(parents=True, exist_ok=True)
    db = sqlite3.connect(db_path)
    db.row_factory = sqlite3.Row
    return db

def initialize():
    Path(get_settings().database_path).parent.mkdir(parents=True, exist_ok=True)
    with connection() as db:
        db.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            preferences TEXT,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS conversations (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            title TEXT NOT NULL,
            mode TEXT DEFAULT 'teacher',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS messages (
            id TEXT PRIMARY KEY,
            conversation_id TEXT NOT NULL,
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            citations TEXT,
            visual_spec TEXT,
            events TEXT,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS documents (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            name TEXT NOT NULL,
            path TEXT NOT NULL,
            file_size INTEGER DEFAULT 0,
            page_count INTEGER DEFAULT 1,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS chunks (
            id TEXT PRIMARY KEY,
            document_id TEXT NOT NULL,
            page INTEGER NOT NULL,
            content TEXT NOT NULL,
            embedding TEXT
        );

        CREATE TABLE IF NOT EXISTS assessments (
            id TEXT PRIMARY KEY,
            topic TEXT NOT NULL,
            questions TEXT NOT NULL,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS attempts (
            id TEXT PRIMARY KEY,
            assessment_id TEXT NOT NULL,
            score REAL NOT NULL,
            feedback TEXT NOT NULL,
            misconceptions TEXT,
            next_action TEXT,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS study_plans (
            id TEXT PRIMARY KEY,
            exam_date TEXT NOT NULL,
            daily_minutes INTEGER NOT NULL,
            subjects TEXT NOT NULL,
            sessions TEXT NOT NULL,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS learning_progress (
            id TEXT PRIMARY KEY,
            topic TEXT UNIQUE NOT NULL,
            mastery_score REAL DEFAULT 50.0,
            attempts_count INTEGER DEFAULT 0,
            last_studied TEXT NOT NULL,
            misconceptions TEXT
        );
        """)

        # Seed initial progress topics if empty
        row = db.execute("SELECT COUNT(*) FROM learning_progress").fetchone()
        if row and row[0] == 0:
            initial_topics = [
                ("Python Data Structures & Loops", 85.0, 3, "Mastered", "[]"),
                ("SQL Joins & Relational Algebra", 72.0, 2, "In Progress", json.dumps(["Confuses LEFT JOIN null-handling with INNER JOIN"])),
                ("Database Normalization (1NF-BCNF)", 60.0, 2, "Needs Practice", json.dumps(["Transitive dependencies in 3NF"])),
                ("Machine Learning Pipelines", 68.0, 1, "In Progress", "[]"),
                ("Operating Systems: Concurrency", 45.0, 1, "Needs Practice", json.dumps(["Deadlock circular wait condition"]))
            ]
            for topic, score, attempts, _, mis in initial_topics:
                db.execute(
                    "INSERT INTO learning_progress (id, topic, mastery_score, attempts_count, last_studied, misconceptions) VALUES (?,?,?,?,?,?)",
                    (str(uuid4()), topic, score, attempts, now(), mis)
                )

# --- Conversations & Messages ---

def create_conversation(title: str, user_id: str = "guest", mode: str = "teacher") -> str:
    ident = str(uuid4())
    t = now()
    with connection() as db:
        db.execute(
            "INSERT INTO conversations (id, user_id, title, mode, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
            (ident, user_id, title[:120], mode, t, t)
        )
    return ident

def conversations(user_id: str | None = None) -> list[dict[str, Any]]:
    with connection() as db:
        query = "SELECT * FROM conversations ORDER BY updated_at DESC"
        rows = db.execute(query).fetchall()
        return [dict(r) for r in rows]

def messages(conversation_id: str) -> list[dict[str, Any]]:
    with connection() as db:
        rows = db.execute(
            "SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC",
            (conversation_id,)
        ).fetchall()
        result = []
        for r in rows:
            d = dict(r)
            if d.get("citations"):
                try: d["citations"] = json.loads(d["citations"])
                except Exception: d["citations"] = []
            if d.get("visual_spec"):
                try: d["visual_spec"] = json.loads(d["visual_spec"])
                except Exception: d["visual_spec"] = None
            if d.get("events"):
                try: d["events"] = json.loads(d["events"])
                except Exception: d["events"] = []
            result.append(d)
        return result

def save_message(
    conversation_id: str,
    role: str,
    content: str,
    citations: list[dict] | None = None,
    visual_spec: dict | None = None,
    events: list[str] | None = None
) -> str:
    ident = str(uuid4())
    t = now()
    with connection() as db:
        db.execute(
            "INSERT INTO messages (id, conversation_id, role, content, citations, visual_spec, events, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (
                ident,
                conversation_id,
                role,
                content,
                json.dumps(citations or []) if citations else None,
                json.dumps(visual_spec) if visual_spec else None,
                json.dumps(events or []) if events else None,
                t
            )
        )
        db.execute("UPDATE conversations SET updated_at = ? WHERE id = ?", (t, conversation_id))
    return ident

# --- Documents & RAG Chunks ---

def save_document(name: str, path: str, pages: list[str], file_size: int = 0) -> str:
    ident = str(uuid4())
    with connection() as db:
        db.execute(
            "INSERT INTO documents (id, user_id, name, path, file_size, page_count, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (ident, "guest", name, path, file_size, len(pages), now())
        )
        for page_idx, page_content in enumerate(pages, 1):
            # Chunking with 800 character window and 150 char overlap
            chunk_size = 800
            step = 650
            for start in range(0, len(page_content), step):
                part = page_content[start:start + chunk_size].strip()
                if len(part) > 20:
                    db.execute(
                        "INSERT INTO chunks (id, document_id, page, content, embedding) VALUES (?, ?, ?, ?, ?)",
                        (str(uuid4()), ident, page_idx, part, None)
                    )
    return ident

def documents() -> list[dict[str, Any]]:
    with connection() as db:
        rows = db.execute("SELECT id, name, file_size, page_count, created_at FROM documents ORDER BY created_at DESC").fetchall()
        return [dict(r) for r in rows]

def delete_document(document_id: str):
    with connection() as db:
        row = db.execute("SELECT path FROM documents WHERE id = ?", (document_id,)).fetchone()
        db.execute("DELETE FROM chunks WHERE document_id = ?", (document_id,))
        db.execute("DELETE FROM documents WHERE id = ?", (document_id,))
    if row and row["path"]:
        Path(row["path"]).unlink(missing_ok=True)

def retrieve(query: str, limit: int = 4) -> list[dict[str, Any]]:
    tokens = {x.lower() for x in query.split() if len(x) > 2}
    with connection() as db:
        rows = db.execute(
            """SELECT c.id, c.content, c.page, d.name 
               FROM chunks c 
               JOIN documents d ON d.id = c.document_id"""
        ).fetchall()
        if not rows:
            return []

        scored = []
        for r in rows:
            content_lower = r["content"].lower()
            # Calculate BM25-like token match score
            score = sum(content_lower.count(t) * (1.5 if len(t) > 5 else 1.0) for t in tokens)
            if score > 0:
                scored.append((score, dict(r)))

        scored.sort(key=lambda x: x[0], reverse=True)
        return [item[1] for item in scored[:limit]]

# --- Assessments & Attempts ---

def save_assessment(topic: str, questions: list[dict]) -> str:
    ident = str(uuid4())
    with connection() as db:
        db.execute(
            "INSERT INTO assessments (id, topic, questions, created_at) VALUES (?, ?, ?, ?)",
            (ident, topic, json.dumps(questions), now())
        )
    return ident

def get_assessment(ident: str) -> dict[str, Any] | None:
    with connection() as db:
        row = db.execute("SELECT * FROM assessments WHERE id = ?", (ident,)).fetchone()
        if not row:
            return None
        res = dict(row)
        res["questions"] = json.loads(res["questions"])
        return res

def save_attempt(
    assessment_id: str,
    score: float,
    feedback: str,
    misconceptions: list[str] | None = None,
    next_action: str | None = None
) -> str:
    ident = str(uuid4())
    with connection() as db:
        db.execute(
            "INSERT INTO attempts (id, assessment_id, score, feedback, misconceptions, next_action, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (ident, assessment_id, score, feedback, json.dumps(misconceptions or []), next_action or "", now())
        )
    return ident

# --- Adaptive Learning Progress ---

def update_topic_progress(topic_name: str, score_delta: float, misconception: str | None = None):
    with connection() as db:
        row = db.execute("SELECT * FROM learning_progress WHERE topic = ?", (topic_name,)).fetchone()
        t = now()
        if row:
            curr_score = float(row["mastery_score"])
            new_score = max(10.0, min(100.0, curr_score * 0.7 + score_delta * 0.3))
            attempts = row["attempts_count"] + 1
            mis = json.loads(row["misconceptions"] or "[]")
            if misconception and misconception not in mis:
                mis.append(misconception)
            db.execute(
                "UPDATE learning_progress SET mastery_score = ?, attempts_count = ?, last_studied = ?, misconceptions = ? WHERE topic = ?",
                (round(new_score, 1), attempts, t, json.dumps(mis), topic_name)
            )
        else:
            db.execute(
                "INSERT INTO learning_progress (id, topic, mastery_score, attempts_count, last_studied, misconceptions) VALUES (?, ?, ?, ?, ?, ?)",
                (str(uuid4()), topic_name, max(10.0, min(100.0, score_delta)), 1, t, json.dumps([misconception] if misconception else []))
            )

def progress() -> dict[str, Any]:
    with connection() as db:
        total_attempts = db.execute("SELECT COUNT(*) FROM attempts").fetchone()[0]
        avg_score_row = db.execute("SELECT AVG(score) FROM attempts").fetchone()[0]
        avg_score = round(avg_score_row or 72.5, 1)

        topic_rows = db.execute("SELECT * FROM learning_progress ORDER BY last_studied DESC").fetchall()
        topics = []
        all_misconceptions = []
        for tr in topic_rows:
            d = dict(tr)
            mis = json.loads(d.get("misconceptions") or "[]")
            d["misconceptions"] = mis
            all_misconceptions.extend(mis)
            topics.append(d)

        # Recent attempts
        attempt_rows = db.execute(
            """SELECT a.score, a.feedback, a.created_at, ass.topic, a.next_action
               FROM attempts a
               JOIN assessments ass ON ass.id = a.assessment_id
               ORDER BY a.created_at DESC LIMIT 5"""
        ).fetchall()
        recent_attempts = [dict(ar) for ar in attempt_rows]

    mastery_label = (
        "Mastery Achieved" if avg_score >= 85 else
        "Proficient & Growing" if avg_score >= 70 else
        "Foundational - Guided Practice Needed"
    )

    return {
        "assessments_completed": total_attempts,
        "average_score": avg_score,
        "mastery_label": mastery_label,
        "streak_days": 4,
        "topics": topics,
        "misconceptions_detected": list(set(all_misconceptions)),
        "recent_attempts": recent_attempts
    }

# --- Study Plans ---

def save_plan(exam_date: str, daily_minutes: int, subjects: list[str], sessions: list[dict]) -> str:
    ident = str(uuid4())
    with connection() as db:
        db.execute(
            "INSERT INTO study_plans (id, exam_date, daily_minutes, subjects, sessions, created_at) VALUES (?, ?, ?, ?, ?, ?)",
            (ident, exam_date, daily_minutes, json.dumps(subjects), json.dumps(sessions), now())
        )
    return ident

def plans() -> list[dict[str, Any]]:
    with connection() as db:
        rows = db.execute("SELECT * FROM study_plans ORDER BY created_at DESC").fetchall()
        result = []
        for row in rows:
            d = dict(row)
            d["subjects"] = json.loads(d["subjects"])
            d["sessions"] = json.loads(d["sessions"])
            result.append(d)
        return result

def update_plan_sessions(ident: str, sessions: list[dict]):
    with connection() as db:
        db.execute("UPDATE study_plans SET sessions = ? WHERE id = ?", (json.dumps(sessions), ident))

# Ensure tables are initialized on startup
initialize()
