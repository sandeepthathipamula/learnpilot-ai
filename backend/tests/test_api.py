import os
from io import BytesIO
from fastapi.testclient import TestClient
from app.main import app
from app.config import get_settings

client = TestClient(app)

def test_health():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"

def test_requires_configured_gemini(monkeypatch):
    monkeypatch.setenv("TESTING_NO_API_KEY", "1")
    get_settings.cache_clear()
    try:
        response = client.post("/api/chat", json={"message": "Explain loops"})
        assert response.status_code == 503
        assert "Gemini is not configured" in response.json()["detail"]
    finally:
        monkeypatch.delenv("TESTING_NO_API_KEY", raising=False)
        get_settings.cache_clear()

def test_chat_with_gemini():
    # If key is available in environment
    settings = get_settings()
    if settings.gemini_api_key:
        response = client.post("/api/chat", json={"message": "What is 2+2? Answer in one word."})
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "content" in data["message"]
        assert len(data["events"]) > 0

def test_document_validation():
    # Test uploading non-pdf file
    fake_file = BytesIO(b"Hello text file content")
    response = client.post(
        "/api/documents",
        files={"file": ("notes.txt", fake_file, "text/plain")}
    )
    assert response.status_code == 415

def test_assessment_flow():
    # Create assessment
    create_res = client.post("/api/assessments", json={"topic": "Relational Databases"})
    assert create_res.status_code == 200
    data = create_res.json()
    assert "id" in data
    assert "questions" in data
    assert len(data["questions"]) > 0
    assessment_id = data["id"]

    # Submit assessment
    submit_res = client.post(
        f"/api/assessments/{assessment_id}/submit",
        json={"answers": ["0", "0"]}
    )
    assert submit_res.status_code == 200
    sub_data = submit_res.json()
    assert "score" in sub_data
    assert "feedback" in sub_data

def test_study_plan_flow():
    # Create study plan
    create_res = client.post(
        "/api/study-plans",
        json={
            "exam_date": "2026-11-15",
            "daily_minutes": 60,
            "subjects": ["DBMS", "Python", "Algorithms"]
        }
    )
    assert create_res.status_code == 200
    plan_data = create_res.json()
    assert "id" in plan_data
    assert len(plan_data["sessions"]) > 0
    plan_id = plan_data["id"]

    # Patch study plan session
    patch_res = client.patch(
        f"/api/study-plans/{plan_id}",
        json={"completed_sessions": [0]}
    )
    assert patch_res.status_code == 200
    patch_data = patch_res.json()
    assert patch_data["sessions"][0]["completed"] is True

def test_progress_endpoint():
    response = client.get("/api/progress")
    assert response.status_code == 200
    data = response.json()
    assert "average_score" in data
    assert "topics" in data

def test_visual_generation_endpoint():
    response = client.post("/api/visual/generate?concept=sql join")
    assert response.status_code == 200
    data = response.json()
    assert data["type"] == "sql_join"
    assert "table_a" in data
    assert "table_b" in data
