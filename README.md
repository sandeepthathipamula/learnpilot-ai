<<<<<<< HEAD
# LearnPilot AI

**Don't Just Learn. Get Guided.**

LearnPilot AI is an autonomous, voice-first AI learning companion that teaches students like a dedicated teacher or helpful friend. Powered by **Google Gemini (gemini-3.8-flash)**, **LangGraph** orchestration, **FastAPI**, and a **React + TypeScript** frontend with interactive SVG visual models and academic PDF RAG.

---

## Key Modules & Capabilities

1. **Conversational AI & LangGraph Decision Engine**
   - Stateful multi-step graph (`classify_and_plan` → `knowledge_agent` → `teaching_agent` → `verification_agent` → `progress_node`).
   - Truthful real-time workflow events displayed in the UI:
     - *Understanding your question*
     - *Searching your notes*
     - *Preparing an explanation*
     - *Verifying academic accuracy & code safety*
     - *Updating your learning progress*
   - Three distinct pedagogical modes:
     - **Friend Mode**: Warm, conversational analogies, peer encouragement, and bilingual English/Telugu explanations.
     - **Teacher Mode**: Structured definitions, step-by-step logic, and check-for-understanding questions.
     - **Learn-by-Doing Mode**: Direct interactive code micro-challenges and immediate evaluative feedback.

2. **Specialist Agents**
   - **Knowledge Agent**: Searches uploaded PDF notes and extracts grounded excerpts and page citations.
   - **Teaching Agent**: Selects explanation strategies and generates structured visual models (`visual_spec`).
   - **Assessment Agent**: Constructs diagnostic quizzes, diagnoses student misconceptions, and prescribes next actions.
   - **Verification Agent**: Validates code syntax via AST parsing and checks citation grounding against retrieved evidence.

3. **Voice Teaching Studio**
   - Web Speech API integration (`SpeechRecognition` and `SpeechSynthesis`).
   - Animated audio wave visualizer reflecting real-time speaking amplitude.
   - Voice controls: Play, Pause, Resume, Stop speaking.
   - Bilingual voice prompts in English (`en-IN`) and Telugu (`te-IN`).
   - Adjustable speech rate and pitch.

4. **Interactive Visual Teaching Canvas**
   - **SQL Joins**: Interactive relational table visualizer with live `INNER JOIN`, `LEFT JOIN`, and `RIGHT JOIN` matching animations.
   - **Python Loop & Variable Tracer**: Line-by-line program counter execution with a live memory register watch table (`i`, `total`, console stdout).
   - **Machine Learning Pipeline**: Multi-phase interactive dataflow from raw ingestion to preprocessing, feature scaling, model fitting, and validation metrics.
   - **On-Demand Visual Generator**: Type any concept (e.g. *Binary Search Tree*) to generate interactive visual models dynamically.

5. **Academic Knowledge & RAG Library**
   - Upload course lecture and syllabus PDFs (up to 20MB).
   - Page-by-page extraction via **PyMuPDF (`fitz`)**, semantic chunking, and keyword/embedding indexing.
   - Grounded inline citations with clickable page references and excerpt viewers.
   - Document deletion removes both physical files and vector chunks.

6. **Adaptive Learning & Mastery Feedback Loop**
   - Diagnoses specific knowledge gaps (e.g. *confuses LEFT JOIN null-handling with INNER JOIN*).
   - Updates topic mastery scores based on real evidence from quizzes.
   - Progress dashboard tracking mastery labels, learning streaks, and historical diagnostic attempts.

7. **Autonomous Study Planner**
   - Generates realistic multi-week schedules based on exam dates, daily study time, and syllabus subjects.
   - Interactive milestone checklist to mark sessions complete.
   - Recalculates remaining tasks when days are missed.

---

## 11 Complete Application Screens

1. **Landing Page**: Product vision, tagline, feature showcases, and interactive goal launcher.
2. **Student Authentication Modal**: Login, registration, and Guest Scholar quick-access.
3. **Student Dashboard**: Mastery score, study streak, topic breakdown, and quick launch pads.
4. **AI Learning Workspace**: Conversational chat with Markdown, math equations, code blocks, mode switcher, LangGraph event stepper, embedded visual canvas, and citation drawers.
5. **Voice Teaching Studio**: Spoken AI companion with animated voice wave visualizer, transcript display, speech controls, and Telugu/English prompts.
6. **Interactive Visual Teaching Canvas**: Dedicated studio for SQL joins, Python loop tracing, and ML pipelines.
7. **Notes Library (RAG)**: PDF upload, page count display, grounded question shortcuts, and deletion.
8. **Diagnostic Quiz & Assessment**: Diagnostic question cards, instant grading feedback, misconception diagnosis, and next-action recommendations.
9. **Learning Progress Analytics**: Mastery percentage, topic breakdown, flagged knowledge gaps, and attempt history.
10. **Study Planner**: Target exam countdown, daily commitment scheduler, and session checklist.
11. **Settings & Profile**: Student preferences, voice speed slider, default mode, and live Gemini API health monitor.

---

## Quickstart & Local Setup

### 1. Environment Configuration

Create a `.env` file in the project root (or inside `backend/`):
```bash
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-3.8-flash
DATABASE_PATH=learnpilot.db
```
*(A template is provided in `.env.example`.)*

### 2. Backend Setup

```bash
cd backend
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```
API Documentation will be available at `http://localhost:8000/docs`.

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```
The React application will run at `http://localhost:5173`.

### 4. Running Backend Tests

```bash
cd backend
python -m pytest -v
```

### 5. Running with Docker Compose

```bash
docker-compose up --build
```
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8000`

---

## Security & Reliability

- **Server-Side API Key**: The `GEMINI_API_KEY` is strictly accessed within Python backend modules and is never exposed to client-side code.
- **Graceful Error Handling**: Missing API keys return clear HTTP 503 errors detailing missing credentials without fabricating false answers. Quota limits and timeouts return actionable 429 and 502 messages.
- **Input Validation**: Strict Pydantic models for chat payloads, assessments, PDF uploads, and study plan inputs.
=======
# ai-chatbot
an agentic ai chatbot 
>>>>>>> b9b7d00f7830184f298494f92fc37b3ed5cd22e6
