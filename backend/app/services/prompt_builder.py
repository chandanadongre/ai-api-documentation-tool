from typing import List, Dict
from sqlalchemy.orm import Session
from app.models.endpoint import Endpoint
from app.models.dto import DTO, Parameter
from app.services.retriever import retrieve


INTENT_KEYWORDS = {
    "code": ["curl", "python", "javascript", "js", "code", "example", "snippet", "generate"],
    "auth": ["auth", "authentication", "token", "bearer", "login", "secure", "jwt"],
    "test": ["test", "junit", "pytest", "postman", "testing"],
    "error": ["error", "fail", "exception", "status", "400", "401", "403", "404", "500"],
}


def detect_intent(question: str) -> str:
    q = question.lower()
    for intent, keywords in INTENT_KEYWORDS.items():
        if any(k in q for k in keywords):
            return intent
    return "general"


def _summarise_endpoints(endpoints: List[Endpoint], db: Session) -> str:
    lines = []
    for ep in endpoints[:30]:  # cap at 30 to stay within token limits
        params = db.query(Parameter).filter(Parameter.endpoint_id == ep.id).all()
        param_str = ", ".join(
            f"{p.name}({p.param_type}{'*' if p.required else ''})"
            for p in params
        )
        auth = " [AUTH]" if ep.auth_required else ""
        lines.append(f"  {ep.http_method} {ep.path}{auth} — params: {param_str or 'none'}")
    return "\n".join(lines)


def _summarise_dtos(dtos: List[DTO]) -> str:
    lines = []
    for dto in dtos[:20]:
        if dto.fields:
            fields_str = ", ".join(f"{f['name']}:{f['type']}" for f in dto.fields[:8])
            lines.append(f"  {dto.name} ({dto.dto_type}): {fields_str}")
    return "\n".join(lines)


def build_messages(project_name: str, project_id: str, question: str,
                   history: List[Dict], db: Session) -> List[Dict]:
    endpoints = db.query(Endpoint).filter(Endpoint.project_id == project_id).all()
    dtos = db.query(DTO).filter(DTO.project_id == project_id).all()
    retrieved = retrieve(project_id, question, db, top_k=5)

    intent = detect_intent(question)

    intent_instructions = {
        "code": "When asked for code examples, always provide complete, runnable curl, Python requests, or JavaScript fetch snippets.",
        "auth": "Explain the authentication mechanism clearly. If JWT Bearer is used, show exactly how to include the token.",
        "test": "Generate comprehensive test cases covering happy path, validation errors, auth failures, and edge cases.",
        "error": "Explain error responses with their HTTP status codes and likely causes.",
        "general": "Answer clearly and concisely based on the API context provided.",
    }

    system_prompt = f"""You are an expert API assistant for the project "{project_name}".
You have full knowledge of this API's endpoints, parameters, and data models.
{intent_instructions.get(intent, '')}

ENDPOINTS:
{_summarise_endpoints(endpoints, db) or 'No endpoints discovered yet.'}

DATA MODELS (DTOs):
{_summarise_dtos(dtos) or 'No DTOs discovered yet.'}

RELEVANT CONTEXT (semantic search):
{chr(10).join(retrieved) or 'N/A'}

Rules:
- Only answer questions about this API.
- Always reference specific endpoint paths and field names from the context above.
- Format code blocks with proper markdown fences.
- Be concise but complete."""

    messages = [{"role": "system", "content": system_prompt}]

    # Include last 6 turns of history for context
    for msg in history[-6:]:
        messages.append({"role": msg["role"], "content": msg["content"]})

    messages.append({"role": "user", "content": question})
    return messages
