from typing import List, Dict
from sqlalchemy.orm import Session
from app.models.endpoint import Endpoint
from app.models.dto import DTO, Parameter


def build_chunks(project_id: str, db: Session) -> List[Dict]:
    """Return list of {chunk_type, label, content} dicts for a project."""
    chunks = []

    endpoints = db.query(Endpoint).filter(Endpoint.project_id == project_id).all()
    for ep in endpoints:
        params = db.query(Parameter).filter(Parameter.endpoint_id == ep.id).all()
        param_lines = "\n".join(
            f"  - {p.name} ({p.param_type}, {'required' if p.required else 'optional'})"
            for p in params
        )
        content = (
            f"{ep.http_method} {ep.path}\n"
            f"Controller: {ep.controller_name or 'unknown'}\n"
            f"Auth required: {ep.auth_required}\n"
            f"Parameters:\n{param_lines or '  none'}"
        )
        chunks.append({"chunk_type": "endpoint", "label": f"{ep.http_method} {ep.path}", "content": content})

    dtos = db.query(DTO).filter(DTO.project_id == project_id).all()
    for dto in dtos:
        if not dto.fields:
            continue
        fields_str = "\n".join(f"  - {f['name']}: {f['type']}" for f in dto.fields)
        content = f"{dto.dto_type} {dto.name}\nFields:\n{fields_str}"
        chunks.append({"chunk_type": "dto", "label": dto.name, "content": content})

    return chunks
