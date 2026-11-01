# GatherWise Python Backend (FastAPI)

A high-performance Python backend service for GatherWise built with **FastAPI**, **Pydantic v2**, and **Google GenAI**.

---

## Capabilities & Endpoints

| Endpoint | Method | Description |
| --- | :---: | --- |
| `/` | `GET` | Service index, documentation links, and operational status |
| `/api/health` | `GET` | System health check and capability flags (`ai`, `weather`, `cloud`) |
| `/api/weather` | `GET` | 16-day Open-Meteo weather forecast proxy with memory caching & Indian city coordinates |
| `/api/ai/chat` | `POST` | AI assistant powered by Google Gemini (with deterministic rule-based fallback) |
| `/api/ai/ideas` | `POST` | Celebration ideas and inspiration generator |
| `/docs` | `GET` | Interactive Swagger / OpenAPI documentation |

---

## Quickstart

### 1. Setup Virtual Environment
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
```

### 2. Run the Python Backend
```bash
# Standalone (port 8000)
uvicorn backend.app.main:app --reload --port 8000

# Or via npm script
npm run start:python
```

### 3. Run Both Client & Python Backend Concurrently
```bash
npm run dev:python
```
The Vite development server will automatically proxy all `/api/*` traffic to the FastAPI server at `http://localhost:8000`.

### 4. Run Tests
```bash
npm run test:python
# or
.venv/bin/pytest backend/tests
```
