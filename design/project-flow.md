# API Documentation AI — Project Flow Design

## User Journey

### 1. Onboarding Flow
```
Landing Page
     │
     ├── Register (email + password)
     │        │
     │        ▼
     │   Email verified → Dashboard
     │
     └── Login
              │
              ▼
         Dashboard (Projects List)
```

---

### 2. Create Project Flow
```
Dashboard → "New Project"
                │
                ▼
        Enter Project Name
        Enter Description
                │
                ▼
        Choose Source:
        ┌───────────────────────┐
        │  A) GitHub URL        │
        │  B) Upload ZIP/folder │
        └───────────────────────┘
                │
        ┌───────┴────────┐
        ▼                ▼
   GitHub URL        File Upload
   Input field       Drag & Drop
        │                │
        └───────┬────────┘
                ▼
        [ Analyze Repository ]
                │
                ▼
        Analysis Progress Screen
        ┌─────────────────────────┐
        │ ✓ Fetching repository   │
        │ ✓ Scanning Java files   │
        │ ⟳ Parsing endpoints...  │
        │ ○ Building API model    │
        │ ○ Indexing for AI       │
        └─────────────────────────┘
                │
                ▼
        Project Dashboard (READY)
```

---

### 3. API Explorer Flow
```
Project Dashboard
        │
        ▼
Endpoint List (sidebar)
  GET    /users
  GET    /users/{id}
  POST   /users
  POST   /payments
  ...
        │
        ▼ (click endpoint)
Endpoint Detail Panel
  ┌─────────────────────────────┐
  │ POST /payments              │
  │ Description (AI-generated)  │
  │                             │
  │ Parameters                  │
  │   @RequestBody PaymentReq   │
  │   Fields: amount, currency  │
  │                             │
  │ Response: 201 PaymentResp   │
  │   Fields: paymentId, status │
  │                             │
  │ Authentication: JWT Bearer  │
  └─────────────────────────────┘
        │
        ▼ (click "Try It")
API Playground
  ┌─────────────────────────────┐
  │ Bearer Token [___________]  │
  │                             │
  │ Request Body                │
  │ {                           │
  │   "amount": 1000,           │
  │   "currency": "INR"         │
  │ }                           │
  │                             │
  │        [ Execute ]          │
  │                             │
  │ Response — 201 Created      │
  │ {                           │
  │   "paymentId": "P123",      │
  │   "status": "SUCCESS"       │
  │ }                           │
  └─────────────────────────────┘
```

---

### 4. AI Assistant Flow
```
Project Dashboard → "AI Assistant" tab
        │
        ▼
Chat Interface
  ┌─────────────────────────────────────┐
  │ 🤖 Ask me anything about this API   │
  │                                     │
  │ User: How do I create a payment?    │
  │                                     │
  │ AI: To create a payment, send a     │
  │     POST request to /payments with  │
  │     a JSON body containing:         │
  │     - amount (required, integer)    │
  │     - currency (required, string)   │
  │                                     │
  │     Example curl:                   │
  │     curl -X POST /payments \        │
  │       -H "Authorization: Bearer..." │
  │       -d '{"amount":1000,...}'      │
  └─────────────────────────────────────┘

Intent types handled:
  - How-to questions       → step-by-step explanation
  - Auth questions         → auth mechanism details
  - Field questions        → DTO field breakdown
  - Code generation        → curl / Python / JS snippets
  - Error questions        → error codes and handling
  - Test generation        → redirect to Tests tab
```

---

### 5. Test Generation Flow
```
Endpoint Detail → "Generate Tests"
        │
        ▼
Test Configuration
  ┌─────────────────────────────┐
  │ Endpoint: POST /payments    │
  │ Framework: [JUnit ▼]        │
  │ [ Generate Test Cases ]     │
  └─────────────────────────────┘
        │
        ▼
Generated Test Cases
  ✓ Valid payment
  ✓ Missing amount field
  ✓ Negative amount
  ✓ Unsupported currency
  ✓ Missing authentication
  ✓ Invalid authentication
  ✓ Duplicate payment
  ✓ Database failure simulation
        │
        ▼
Generated Code (JUnit)
  ┌─────────────────────────────┐
  │ @Test                       │
  │ void testValidPayment() {   │
  │   ...                       │
  │ }                           │
  └─────────────────────────────┘
  [ Copy ] [ Download .java ]
```

---

### 6. OpenAPI Export Flow
```
Project Dashboard → "Export"
        │
        ▼
  [ Download openapi.yaml ]
        │
        ▼
  Standard OpenAPI 3.0 spec
  importable into Postman,
  Insomnia, Swagger UI, etc.
```

---

## Phase-by-Phase Build Flow

```
Phase 1 — Skeleton
  Angular app with routing + auth pages
  FastAPI with /auth endpoints
  PostgreSQL schema (users, projects)
  JWT auth working end-to-end

Phase 2 — Parser
  GitHub URL fetch + ZIP upload
  Java Spring Boot annotation parser
  Endpoint + DTO extraction
  Store in PostgreSQL

Phase 3 — Documentation + Playground
  Endpoint list UI
  Endpoint detail view
  API Playground (live execution)
  OpenAPI YAML generation + download

Phase 4 — AI Assistant
  Groq API integration
  Chat interface in Angular
  Basic prompt engineering

Phase 5 — RAG
  pgvector setup
  Code chunking + embedding
  Semantic retrieval pipeline
  Improved AI answers with context

Phase 6 — Test Generation
  JUnit test generation via Groq
  Test case display + download
  pytest support

Phase 7 — CLI
  api-forge analyze ./project
  Outputs openapi.yaml + summary

Phase 8 — Release
  Docker Compose (all services)
  Cloud deployment guide
  Open-source documentation
```
