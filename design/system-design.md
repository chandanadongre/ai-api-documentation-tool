# API Documentation AI — System Design

## Overview

API Doc AI is a full-stack platform that ingests a GitHub repository (or uploaded source code),
parses Java Spring Boot controllers and DTOs, builds an internal API model, stores it in PostgreSQL,
indexes it into pgvector for semantic search, and exposes it through an Angular dashboard with
an AI assistant powered by Groq (LLaMA 3).

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Angular Frontend                          │
│                                                                  │
│  Auth Pages  │  Dashboard  │  API Explorer  │  AI Assistant     │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTP / REST (JWT Bearer)
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                        FastAPI Backend                           │
│                                                                  │
│  /auth      │  /projects  │  /endpoints  │  /ai  │  /tests      │
└──────┬───────────┬──────────────┬──────────────┬────────────────┘
       │           │              │              │
       ▼           ▼              ▼              ▼
  PostgreSQL   GitHub API    Repository      Groq API
  + pgvector   (REST v3)      Parser         (LLaMA 3)
                              (Python)
```

---

## Component Breakdown

### 1. Angular Frontend
- Single Page Application (SPA)
- Communicates with FastAPI via REST over HTTP
- JWT token stored in localStorage, sent as `Authorization: Bearer <token>` header
- Key modules:
  - AuthModule — login, register, token management
  - ProjectsModule — create/list projects, connect GitHub repo
  - ExplorerModule — endpoint list, API playground (execute live requests)
  - AIModule — chat interface for AI assistant
  - TestsModule — generate and view test cases

### 2. FastAPI Backend
- Stateless REST API
- JWT authentication middleware on all protected routes
- Routers:
  - `auth` — register, login, token refresh
  - `projects` — CRUD for projects, trigger analysis
  - `repositories` — GitHub fetch or file upload
  - `endpoints` — list discovered endpoints, get details
  - `openapi` — generate and download openapi.yaml
  - `ai` — chat with AI assistant
  - `tests` — generate test cases

### 3. Repository Parser (Python module)
- Triggered when a project analysis is started
- Clones or fetches repo files via GitHub API
- Parses Java files for:
  - `@RestController`, `@RequestMapping`
  - `@GetMapping`, `@PostMapping`, `@PutMapping`, `@DeleteMapping`, `@PatchMapping`
  - `@RequestBody`, `@PathVariable`, `@RequestParam`, `@RequestHeader`
  - DTO classes (request/response models)
- Builds structured `APIModel` objects
- Stores results in PostgreSQL
- Chunks and indexes into pgvector

### 4. PostgreSQL + pgvector
- Relational data: users, projects, endpoints, parameters, DTOs
- Vector data: embedded chunks of controller code, DTOs, README
- pgvector enables semantic similarity search for RAG

### 5. Groq API (LLaMA 3)
- Free tier LLM inference
- Used for:
  - Generating endpoint descriptions
  - Answering AI assistant questions
  - Generating test cases
  - Generating code examples (curl, Python, JavaScript)
- RAG pipeline: retrieve relevant chunks from pgvector → inject as context → send to Groq

---

## Data Flow — Repository Analysis

```
User submits GitHub URL or uploads ZIP
           │
           ▼
FastAPI receives request, creates Project record
           │
           ▼
Repository Fetcher (GitHub API or file extraction)
           │
           ▼
Java Parser scans .java files
  - Finds controllers and annotations
  - Extracts endpoints, methods, paths, params
  - Finds DTO classes and fields
           │
           ▼
API Model Builder
  - Structures endpoints with request/response schemas
           │
           ▼
PostgreSQL — stores endpoints, params, DTOs
           │
           ▼
Embedding Service
  - Chunks controller code + DTOs
  - Generates embeddings via sentence-transformers or Groq
  - Stores vectors in pgvector
           │
           ▼
Project status → READY
```

---

## Data Flow — AI Assistant (RAG)

```
User asks: "How do I create a payment?"
           │
           ▼
Intent Detection (classify question type)
           │
           ▼
Embedding of user question
           │
           ▼
pgvector similarity search → top-k relevant chunks
  (controller code, DTOs, README sections)
           │
           ▼
Prompt construction:
  System: "You are an API assistant for {project_name}..."
  Context: [retrieved chunks]
  Question: user's question
           │
           ▼
Groq API (LLaMA 3-8b)
           │
           ▼
Answer streamed back to Angular frontend
```

---

## Authentication Flow

```
Register/Login → FastAPI /auth/login
                      │
                      ▼
              Verify password (bcrypt)
                      │
                      ▼
              Issue JWT (access_token, 30min)
              + Refresh token (7 days)
                      │
                      ▼
              Angular stores token in localStorage
                      │
                      ▼
              All API calls include:
              Authorization: Bearer <access_token>
                      │
                      ▼
              FastAPI JWT middleware validates on every request
```

---

## Security Considerations

- Passwords hashed with bcrypt (cost factor 12)
- JWT signed with HS256, secret from environment variable
- All endpoints protected except `/auth/login` and `/auth/register`
- GitHub tokens stored encrypted in DB (Phase 2+)
- CORS restricted to frontend origin in production
- Rate limiting on AI endpoints to prevent Groq quota abuse

---

## Scalability Notes (Future)

- Parser can be moved to a background task queue (Celery + Redis) for large repos
- Multiple LLM providers can be swapped via a provider interface
- pgvector scales to millions of vectors with HNSW indexing
- Frontend can be deployed to S3 + CloudFront
- Backend can be containerized and deployed to ECS or Lambda
