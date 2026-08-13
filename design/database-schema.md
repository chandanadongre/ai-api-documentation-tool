# API Documentation AI — Database Schema

## Overview

PostgreSQL 16 with pgvector extension.

---

## Tables

### users
```sql
CREATE TABLE users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email       VARCHAR(255) UNIQUE NOT NULL,
    full_name   VARCHAR(255) NOT NULL,
    password    VARCHAR(255) NOT NULL,        -- bcrypt hash
    is_active   BOOLEAN DEFAULT TRUE,
    created_at  TIMESTAMP DEFAULT NOW(),
    updated_at  TIMESTAMP DEFAULT NOW()
);
```

### projects
```sql
CREATE TABLE projects (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
    name            VARCHAR(255) NOT NULL,
    description     TEXT,
    source_type     VARCHAR(50) NOT NULL,     -- 'github' | 'upload'
    github_url      VARCHAR(500),
    github_token    VARCHAR(500),             -- encrypted, Phase 2+
    status          VARCHAR(50) DEFAULT 'pending',  -- pending | analyzing | ready | failed
    language        VARCHAR(50) DEFAULT 'java',
    endpoint_count  INTEGER DEFAULT 0,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);
```

### endpoints
```sql
CREATE TABLE endpoints (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      UUID REFERENCES projects(id) ON DELETE CASCADE,
    http_method     VARCHAR(10) NOT NULL,     -- GET | POST | PUT | DELETE | PATCH
    path            VARCHAR(500) NOT NULL,
    controller_name VARCHAR(255),
    method_name     VARCHAR(255),
    description     TEXT,                     -- AI-generated
    auth_required   BOOLEAN DEFAULT FALSE,
    auth_type       VARCHAR(50),              -- 'jwt' | 'basic' | 'api_key' | none
    source_file     VARCHAR(500),
    line_number     INTEGER,
    created_at      TIMESTAMP DEFAULT NOW()
);
```

### parameters
```sql
CREATE TABLE parameters (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    endpoint_id     UUID REFERENCES endpoints(id) ON DELETE CASCADE,
    name            VARCHAR(255) NOT NULL,
    param_type      VARCHAR(50) NOT NULL,     -- 'path' | 'query' | 'header' | 'body'
    data_type       VARCHAR(100),
    required        BOOLEAN DEFAULT FALSE,
    description     TEXT,
    example_value   TEXT
);
```

### dtos
```sql
CREATE TABLE dtos (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id  UUID REFERENCES projects(id) ON DELETE CASCADE,
    name        VARCHAR(255) NOT NULL,
    dto_type    VARCHAR(50),                  -- 'request' | 'response' | 'model'
    source_file VARCHAR(500),
    fields      JSONB                         -- [{name, type, required, description}]
);
```

### endpoint_dtos (join table)
```sql
CREATE TABLE endpoint_dtos (
    endpoint_id UUID REFERENCES endpoints(id) ON DELETE CASCADE,
    dto_id      UUID REFERENCES dtos(id) ON DELETE CASCADE,
    role        VARCHAR(50),                  -- 'request_body' | 'response'
    PRIMARY KEY (endpoint_id, dto_id, role)
);
```

### knowledge_chunks (RAG)
```sql
CREATE TABLE knowledge_chunks (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id  UUID REFERENCES projects(id) ON DELETE CASCADE,
    content     TEXT NOT NULL,
    metadata    JSONB,                        -- {file, type, endpoint, language}
    embedding   vector(1536),                 -- pgvector column
    created_at  TIMESTAMP DEFAULT NOW()
);

CREATE INDEX ON knowledge_chunks
    USING hnsw (embedding vector_cosine_ops);
```

### chat_history
```sql
CREATE TABLE chat_history (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id  UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
    role        VARCHAR(20) NOT NULL,         -- 'user' | 'assistant'
    content     TEXT NOT NULL,
    created_at  TIMESTAMP DEFAULT NOW()
);
```

---

## Entity Relationship Diagram (Text)

```
users
  │
  └──< projects
            │
            ├──< endpoints
            │         │
            │         └──< parameters
            │         │
            │         └──< endpoint_dtos >──┐
            │                               │
            ├──< dtos <─────────────────────┘
            │
            ├──< knowledge_chunks  (pgvector)
            │
            └──< chat_history
```

---

## Metadata Example (knowledge_chunks)

```json
{
  "file": "PaymentController.java",
  "type": "controller",
  "endpoint": "POST /payments",
  "language": "java",
  "chunk_index": 0
}
```

---

## Indexes

```sql
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_endpoints_project_id ON endpoints(project_id);
CREATE INDEX idx_parameters_endpoint_id ON parameters(endpoint_id);
CREATE INDEX idx_dtos_project_id ON dtos(project_id);
CREATE INDEX idx_knowledge_chunks_project_id ON knowledge_chunks(project_id);
CREATE INDEX idx_chat_history_project_id ON chat_history(project_id);
```
