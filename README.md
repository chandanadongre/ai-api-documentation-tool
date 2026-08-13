# API Documentation AI

An open-source AI-powered API discovery, documentation and testing platform.
Analyzes Java Spring Boot source code and automatically generates an interactive API workspace —
documentation, playground, AI assistant, and test generation.

---

## What is API Documentation AI?

Developers often inherit codebases where APIs are undocumented, Swagger doesn't exist, request examples are missing, and tests are nowhere to be found. API Doc AI solves this by pointing at a GitHub repository (or uploading source code directly) and automatically doing the heavy lifting.

It parses Java Spring Boot controllers and DTOs — reading annotations like `@RestController`, `@GetMapping`, `@PostMapping`, `@RequestBody` and so on — then builds a structured API model from the source code. From that model it generates interactive documentation, a live API playground where you can execute requests directly in the browser, an AI assistant powered by Groq (LLaMA 3) that can answer questions about the API, generate curl and code examples, and explain authentication. It also generates test cases (JUnit, pytest, Postman) and exports a standard OpenAPI 3.0 YAML spec that can be imported into any tool like Postman or Insomnia.

The goal is to turn an undocumented repository into a fully interactive developer workspace in minutes, with no manual documentation effort required.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Angular, TypeScript, Angular Material, PrimeNG, NGX-Charts |
| Backend | Python, FastAPI, SQLAlchemy, Alembic |
| Database | PostgreSQL, pgvector |
| Auth | JWT (python-jose + bcrypt) |
| AI / LLM | Groq (free tier) — LLaMA 3, Mixtral |
| Integrations | GitHub REST API, OpenAPI 3.0 |

---

## Project Structure

```
ai-api-documentation-tool/
├── frontend/          # Angular application
├── backend/           # FastAPI Python application
├── design/            # System design, flow diagrams, UI mockups
└── README.md
```

---

## Phases

| Phase | Scope |
|---|---|
| Phase 1 ✅ | Angular + FastAPI + PostgreSQL skeleton with JWT auth |
| Phase 2 | Spring Boot source parser — endpoint and DTO discovery |
| Phase 3 | API documentation UI, playground, OpenAPI generation |
| Phase 4 | AI assistant (Groq + LLaMA 3) |
| Phase 5 | RAG pipeline (pgvector) |
| Phase 6 | Test generation (JUnit, pytest, Postman) |
| Phase 7 | CLI — `api-forge analyze ./project` |
| Phase 8 | Docker + cloud deployment + open-source release |

---

## Getting Started

### Prerequisites
- Python 3.11+, Node.js 20+, PostgreSQL 16+ with pgvector
- Groq API key — free at [groq.com](https://groq.com)

### 1. PostgreSQL
```sql
CREATE DATABASE apiforge;
CREATE EXTENSION IF NOT EXISTS vector;
```

### 2. Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```
API docs: `http://localhost:8000/docs`

### 3. Frontend
```bash
cd frontend
npm install
ng serve
```
App: `http://localhost:4200`
