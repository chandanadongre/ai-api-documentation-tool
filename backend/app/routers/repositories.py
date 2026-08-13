from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks
from sqlalchemy.orm import Session
from typing import Optional
from app.db.session import get_db
from app.models.project import Project
from app.models.endpoint import Endpoint
from app.models.dto import DTO, Parameter
from app.models.user import User
from app.schemas.endpoint import AnalyzeRequest
from app.core.security import get_current_user
from app.services.github_fetcher import fetch_java_files
from app.services.java_parser import parse_java_files
from app.services.zip_extractor import extract_java_files
from app.services.retriever import index_project

router = APIRouter(prefix="/repositories", tags=["repositories"])


def _store_results(db: Session, project_id: str, parsed: dict):
    """Persist parsed endpoints, parameters and DTOs, then update project status."""
    try:
        # Clear previous results if re-analyzing
        db.query(Endpoint).filter(Endpoint.project_id == project_id).delete()
        db.query(DTO).filter(DTO.project_id == project_id).delete()

        for ep_data in parsed["endpoints"]:
            params = ep_data.pop("parameters", [])
            endpoint = Endpoint(project_id=project_id, **ep_data)
            db.add(endpoint)
            db.flush()  # get endpoint.id
            for p in params:
                db.add(Parameter(endpoint_id=endpoint.id, **p))

        for dto_data in parsed["dtos"]:
            db.add(DTO(project_id=project_id, **dto_data))

        project = db.query(Project).filter(Project.id == project_id).first()
        project.endpoint_count = len(parsed["endpoints"])
        project.status = "ready"
        db.commit()
        index_project(project_id, db)
    except Exception as e:
        db.rollback()
        project = db.query(Project).filter(Project.id == project_id).first()
        if project:
            project.status = "failed"
            db.commit()
        raise e


async def _run_github_analysis(project_id: str, github_url: str, token: str, db: Session):
    project = db.query(Project).filter(Project.id == project_id).first()
    project.status = "analyzing"
    db.commit()
    try:
        files = await fetch_java_files(github_url, token)
        if not files:
            raise ValueError("No .java files found in repository")
        parsed = parse_java_files(files)
        _store_results(db, project_id, parsed)
    except Exception:
        project.status = "failed"
        db.commit()


@router.post("/analyze/github")
async def analyze_github(
    payload: AnalyzeRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = db.query(Project).filter(Project.id == payload.project_id, Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if not payload.github_url:
        raise HTTPException(status_code=400, detail="github_url is required")

    project.status = "analyzing"
    db.commit()

    background_tasks.add_task(
        _run_github_analysis,
        payload.project_id,
        payload.github_url,
        payload.github_token or "",
        db,
    )
    return {"message": "Analysis started", "project_id": payload.project_id}


@router.post("/analyze/upload")
async def analyze_upload(
    project_id: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if not file.filename.endswith(".zip"):
        raise HTTPException(status_code=400, detail="Only .zip files are supported")

    project.status = "analyzing"
    db.commit()

    try:
        zip_bytes = await file.read()
        files = extract_java_files(zip_bytes)
        if not files:
            raise ValueError("No .java files found in ZIP")
        parsed = parse_java_files(files)
        _store_results(db, project_id, parsed)
    except Exception as e:
        project.status = "failed"
        db.commit()
        raise HTTPException(status_code=422, detail=str(e))

    return {"message": "Analysis complete", "project_id": project_id, "endpoints_found": project.endpoint_count}
