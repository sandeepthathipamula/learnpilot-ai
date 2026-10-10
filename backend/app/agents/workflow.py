from typing import TypedDict, Literal, Any
from langgraph.graph import StateGraph, START, END
from app.agents.specialists import (
    knowledge_agent,
    teaching_agent,
    verification_agent,
)
from app.database.repository import update_topic_progress

class LearningState(TypedDict, total=False):
    message: str
    mode: Literal["friend", "teacher", "doing"]
    history: list[dict[str, str]]
    intent: Literal["explain", "rag", "assessment", "study_plan", "doing"]
    events: list[str]
    citations: list[dict]
    visual_spec: dict[str, Any] | None
    answer: str
    verified: bool

async def classify_and_plan(state: LearningState) -> dict[str, Any]:
    text = state["message"].lower()
    events = ["Understanding your question"]

    if any(k in text for k in ("quiz", "test me", "assess", "evaluate")):
        intent = "assessment"
        events.append("Preparing diagnostic assessment")
    elif any(k in text for k in ("plan", "schedule", "exam in", "syllabus", "timetable")):
        intent = "study_plan"
        events.append("Analyzing study schedule requirements")
    elif any(k in text for k in ("notes", "pdf", "uploaded", "document", "cite")):
        intent = "rag"
        events.append("Searching your notes")
    elif state.get("mode") == "doing" or any(k in text for k in ("try", "exercise", "practice", "challenge")):
        intent = "doing"
        events.append("Preparing hands-on interactive challenge")
    else:
        intent = "explain"
        events.append("Selecting pedagogical strategy")

    return {
        "intent": intent,
        "events": events
    }

async def knowledge_node(state: LearningState) -> dict[str, Any]:
    events = list(state.get("events", []))
    knowledge_res = await knowledge_agent(state["message"])
    citations = knowledge_res.get("citations", [])
    if citations:
        events.append("Found relevant excerpts from your notes")
    return {
        "citations": citations,
        "events": events
    }

async def teaching_node(state: LearningState) -> dict[str, Any]:
    events = list(state.get("events", []))
    events.append("Preparing an explanation")

    teaching_res = await teaching_agent(
        message=state["message"],
        mode=state.get("mode", "teacher"),
        history=state.get("history", []),
        citations=state.get("citations", [])
    )

    if teaching_res.get("visual_spec"):
        events.append("Generated interactive visual demonstration")

    return {
        "answer": teaching_res["answer"],
        "visual_spec": teaching_res.get("visual_spec"),
        "events": events
    }

async def verification_node(state: LearningState) -> dict[str, Any]:
    events = list(state.get("events", []))
    ver_res = await verification_agent(
        answer=state.get("answer", ""),
        citations=state.get("citations", [])
    )
    events.append("Verifying academic accuracy & code safety")
    return {
        "verified": ver_res.get("verified", True),
        "events": events
    }

async def progress_node(state: LearningState) -> dict[str, Any]:
    events = list(state.get("events", []))
    # Extract candidate topic from message
    topic = state["message"][:45]
    update_topic_progress(topic_name=topic, score_delta=75.0)
    events.append("Updating your learning progress")
    return {
        "events": events
    }

# Build and compile the LangGraph workflow
graph = StateGraph(LearningState)
graph.add_node("classify", classify_and_plan)
graph.add_node("knowledge", knowledge_node)
graph.add_node("teaching", teaching_node)
graph.add_node("verify", verification_node)
graph.add_node("progress", progress_node)

graph.add_edge(START, "classify")
graph.add_edge("classify", "knowledge")
graph.add_edge("knowledge", "teaching")
graph.add_edge("teaching", "verify")
graph.add_edge("verify", "progress")
graph.add_edge("progress", END)

learning_graph = graph.compile()
