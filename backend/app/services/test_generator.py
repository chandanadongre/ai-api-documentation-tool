from typing import List
from sqlalchemy.orm import Session
from app.models.endpoint import Endpoint
from app.models.dto import DTO, Parameter
from app.services.groq_client import chat_completion

FORMAT_INSTRUCTIONS = {
    "junit": "Generate JUnit 5 tests in Java using RestAssured. Include @Test methods for happy path, validation errors (400), and auth failures (401) for each endpoint.",
    "pytest": "Generate pytest tests in Python using the requests library. Include test functions for happy path, validation errors (400), and auth failures (401) for each endpoint.",
    "postman": "Generate a valid Postman Collection v2.1 JSON with one request per endpoint, including example request bodies and test scripts that assert status codes.",
}


def _build_api_summary(project_id: str, db: Session) -> str:
    endpoints = db.query(Endpoint).filter(Endpoint.project_id == project_id).all()
    dtos = db.query(DTO).filter(DTO.project_id == project_id).all()

    lines = []
    for ep in endpoints[:20]:
        params = db.query(Parameter).filter(Parameter.endpoint_id == ep.id).all()
        param_str = ", ".join(f"{p.name}({p.param_type}{'*' if p.required else ''})" for p in params)
        auth = " [AUTH]" if ep.auth_required else ""
        lines.append(f"{ep.http_method} {ep.path}{auth} — {param_str or 'no params'}")

    dto_lines = []
    for dto in dtos[:10]:
        if dto.fields:
            fields_str = ", ".join(f"{f['name']}:{f['type']}" for f in dto.fields[:6])
            dto_lines.append(f"{dto.name}: {fields_str}")

    summary = "ENDPOINTS:\n" + "\n".join(lines)
    if dto_lines:
        summary += "\n\nDTOs:\n" + "\n".join(dto_lines)
    return summary


async def generate_tests(project_id: str, project_name: str, fmt: str, db: Session) -> str:
    instruction = FORMAT_INSTRUCTIONS.get(fmt, FORMAT_INSTRUCTIONS["pytest"])
    api_summary = _build_api_summary(project_id, db)

    messages = [
        {
            "role": "system",
            "content": (
                f"You are an expert test engineer. {instruction}\n"
                "Output ONLY the raw code/JSON — no explanations, no markdown fences."
            ),
        },
        {
            "role": "user",
            "content": f"Generate tests for the API '{project_name}'.\n\n{api_summary}",
        },
    ]
    return await chat_completion(messages)
