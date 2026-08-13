from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.db.session import get_db
from app.models.project import Project
from app.models.test_suite import TestSuite
from app.models.user import User
from app.core.security import get_current_user
from app.services.test_generator import generate_tests

router = APIRouter(prefix="/projects/{project_id}/tests", tags=["tests"])

VALID_FORMATS = {"junit", "pytest", "postman"}
MIME = {"junit": "text/x-java", "pytest": "text/x-python", "postman": "application/json"}
EXT = {"junit": "java", "pytest": "py", "postman": "json"}


class GenerateRequest(BaseModel):
    format: str  # "junit" | "pytest" | "postman"


@router.post("/generate")
async def generate(
    project_id: str,
    payload: GenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if payload.format not in VALID_FORMATS:
        raise HTTPException(status_code=400, detail=f"format must be one of {VALID_FORMATS}")

    project = db.query(Project).filter(Project.id == project_id, Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if project.status != "ready":
        raise HTTPException(status_code=400, detail="Project analysis not complete")

    content = await generate_tests(project_id, project.name, payload.format, db)

    suite = TestSuite(project_id=project_id, format=payload.format, content=content)
    db.add(suite)
    db.commit()
    db.refresh(suite)

    return {"id": str(suite.id), "format": suite.format, "created_at": suite.created_at}


@router.get("")
def list_suites(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    suites = db.query(TestSuite).filter(TestSuite.project_id == project_id).order_by(TestSuite.created_at.desc()).all()
    return [{"id": str(s.id), "format": s.format, "created_at": s.created_at} for s in suites]


@router.get("/{suite_id}/download")
def download_suite(
    project_id: str,
    suite_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    suite = db.query(TestSuite).filter(TestSuite.id == suite_id, TestSuite.project_id == project_id).first()
    if not suite:
        raise HTTPException(status_code=404, detail="Test suite not found")

    filename = f"{project.name}-tests.{EXT[suite.format]}"
    return PlainTextResponse(
        content=suite.content,
        media_type=MIME[suite.format],
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
