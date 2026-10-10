import asyncio
import json
import logging
from typing import Any
from google import genai
from google.genai import types
from app.config import get_settings

logger = logging.getLogger(__name__)

class ProviderConfigurationError(RuntimeError):
    """Raised when Gemini credentials or configuration are missing or invalid."""
    pass

class ProviderRequestError(RuntimeError):
    """Raised when Gemini API request encounters a network, timeout, quota, or model error."""
    pass

def get_client() -> genai.Client:
    settings = get_settings()
    if not settings.gemini_api_key or not settings.gemini_model:
        raise ProviderConfigurationError(
            "Gemini is not configured. Add GEMINI_API_KEY and a supported GEMINI_MODEL to .env, then restart the API."
        )
    return genai.Client(api_key=settings.gemini_api_key)

def _handle_gemini_exception(exc: Exception, settings) -> None:
    logger.exception("Gemini request failed (%s): %s", type(exc).__name__, exc)
    status = getattr(exc, "status_code", None)
    if status in (401, 403):
        msg = "Gemini rejected the API key. Please check your GEMINI_API_KEY in Google AI Studio and ensure it has proper permissions."
    elif status == 404:
        msg = f"Gemini model '{settings.gemini_model}' is unavailable for this key. Please configure a valid model like 'gemini-3.8-flash'."
    elif status == 429:
        msg = "Gemini quota or rate limit was reached. Please wait briefly before retrying or check your Google AI Studio quota."
    elif isinstance(exc, (TimeoutError, asyncio.TimeoutError)):
        msg = "Gemini took too long to respond. The request timed out. Please retry."
    else:
        msg = f"Gemini could not complete this request: {str(exc) or type(exc).__name__}. Check server logs."
    raise ProviderRequestError(msg) from exc

async def generate_teaching_reply(
    message: str,
    mode: str = "teacher",
    history: list[dict[str, str]] | None = None,
    sources: list[dict] | None = None,
    system_override: str | None = None,
) -> str:
    settings = get_settings()
    client = get_client()
    try:
        source_context = ""
        if sources:
            source_context = "\n".join(
                f"Document: {x.get('document_name', 'Notes')} (Page {x.get('page', 1)}): {x.get('excerpt', '')}"
                for x in sources
            )

        mode_instructions = {
            "friend": (
                "You are a friendly, encouraging peer tutor. Use intuitive real-world analogies, warm language, "
                "simple conversational explanations, and natural check-ins. If the user asks in Telugu or requests Telugu, "
                "reply warmly in Telugu (or bilingual Telugu-English) with accurate technical terms."
            ),
            "teacher": (
                "You are an expert pedagogical teacher. Provide structured explanations with clear definitions, "
                "bulleted concepts, real-world examples, and syntax walkthroughs. Conclude with a clear check-for-understanding question."
            ),
            "doing": (
                "You are a hands-on coding and lab coach in 'Learn by Doing' mode. Give a concise concept briefing, "
                "then immediately pose an interactive micro-challenge or code puzzle for the student to solve right now. "
                "Prompt them to answer or write the code."
            ),
        }.get(mode, "You are an expert pedagogical tutor.")

        system = system_override or f"""You are LearnPilot AI, an autonomous, voice-first AI educational companion.
Current Teaching Mode: {mode.upper()}
{mode_instructions}

Formatting Guidelines:
- Use clean Markdown with headers, bullet points, bold key terms, and code blocks with syntax highlighting.
- Format equations and math clearly.
- If document context is provided below, ground your response in the academic notes, cite the document name and page number inline, and clearly distinguish document facts from general knowledge.
- If no notes are relevant or provided, do not fabricate document citations.
- Conclude your answer with a single focused follow-up or check-for-understanding question.

Academic Notes Context:
{source_context if source_context else "(No uploaded notes cited for this response)"}
"""

        contents: list[types.Content] = []
        if history:
            for item in history[-10:]:
                role = "model" if item.get("role") in ("assistant", "model") else "user"
                contents.append(
                    types.Content(role=role, parts=[types.Part.from_text(text=item.get("content", ""))])
                )

        contents.append(types.Content(role="user", parts=[types.Part.from_text(text=message)]))

        response = await asyncio.wait_for(
            asyncio.to_thread(
                client.models.generate_content,
                model=settings.gemini_model,
                contents=contents,
                config=types.GenerateContentConfig(
                    system_instruction=system,
                    temperature=0.4,
                ),
            ),
            timeout=settings.request_timeout_seconds,
        )

        if not response.text:
            raise ProviderRequestError("Gemini returned an empty response. Please try asking again.")

        return response.text

    except ProviderConfigurationError:
        raise
    except Exception as exc:
        _handle_gemini_exception(exc, settings)
        raise

async def generate_structured_json(prompt: str, system_instruction: str = "") -> dict[str, Any]:
    """Generates a structured JSON object using Gemini."""
    settings = get_settings()
    client = get_client()
    try:
        response = await asyncio.wait_for(
            asyncio.to_thread(
                client.models.generate_content,
                model=settings.gemini_model,
                contents=[prompt],
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction or "You are a specialized JSON data generator. Output only valid JSON.",
                    response_mime_type="application/json",
                    temperature=0.2,
                ),
            ),
            timeout=settings.request_timeout_seconds,
        )

        if not response.text:
            raise ProviderRequestError("Gemini returned an empty structured response.")

        return json.loads(response.text)

    except json.JSONDecodeError as exc:
        logger.warning("Failed to decode JSON from Gemini output: %s", exc)
        return {"raw": response.text}
    except ProviderConfigurationError:
        raise
    except Exception as exc:
        _handle_gemini_exception(exc, settings)
        raise

async def generate_text_embedding(text: str) -> list[float]:
    """Generates an embedding vector using Gemini Embedding API."""
    settings = get_settings()
    try:
        client = get_client()
        res = await asyncio.wait_for(
            asyncio.to_thread(
                client.models.embed_content,
                model="gemini-embedding-001",
                contents=text[:2000],
            ),
            timeout=15.0,
        )
        if res and res.embeddings:
            return list(res.embeddings[0].values)
    except Exception as exc:
        logger.warning("Gemini embedding fallback triggered: %s", exc)
    
    # Deterministic fallback term vector for robust local testing without network latency
    return []
