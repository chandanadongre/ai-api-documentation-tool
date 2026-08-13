import yaml
import httpx
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import Response, JSONResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, Any
from app.db.session import get_db
from app.models.project import Project
from app.models.user import User
from app.core.security import get_current_user
from app.services.openapi_generator import generate_openapi

router = APIRouter(prefix="/projects/{project_id}", tags=["openapi"])


@router.get("/openapi.yaml")
def download_openapi(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if project.status != "ready":
        raise HTTPException(status_code=400, detail="Project analysis not complete")

    spec = generate_openapi(project.name, project_id, db)
    yaml_content = yaml.dump(spec, default_flow_style=False, allow_unicode=True, sort_keys=False)

    return Response(
        content=yaml_content,
        media_type="application/x-yaml",
        headers={"Content-Disposition": f'attachment; filename="{project.name}-openapi.yaml"'},
    )


@router.get("/openapi.json")
def get_openapi_json(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    spec = generate_openapi(project.name, project_id, db)
    return JSONResponse(content=spec)


class PlaygroundRequest(BaseModel):
    method: str
    url: str
    headers: Optional[dict] = {}
    body: Optional[Any] = None


@router.post("/playground")
async def playground_proxy(
    project_id: str,
    payload: PlaygroundRequest,
    current_user: User = Depends(get_current_user),
):
    """Proxy HTTP requests from the API playground to the target API."""
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.request(
                method=payload.method.upper(),
                url=payload.url,
                headers=payload.headers or {},
                json=payload.body if payload.body else None,
            )
        return {
            "status_code": response.status_code,
            "headers": dict(response.headers),
            "body": _safe_json(response),
            "elapsed_ms": int(response.elapsed.total_seconds() * 1000),
        }
    except httpx.TimeoutException:
        raise HTTPException(status_code=408, detail="Request timed out")
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))


def _safe_json(response: httpx.Response):
    try:
        return response.json()
    except Exception:
        return response.text
