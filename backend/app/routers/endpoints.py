from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.models.endpoint import Endpoint
from app.models.dto import DTO, Parameter
from app.models.project import Project
from app.models.user import User
from app.schemas.endpoint import EndpointResponse, DTOResponse, ParameterResponse
from app.core.security import get_current_user

router = APIRouter(prefix="/projects/{project_id}", tags=["endpoints"])


def _get_project_or_404(project_id: str, user_id: str, db: Session) -> Project:
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == user_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.get("/endpoints", response_model=List[EndpointResponse])
def list_endpoints(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_project_or_404(project_id, current_user.id, db)
    endpoints = db.query(Endpoint).filter(Endpoint.project_id == project_id).all()
    result = []
    for ep in endpoints:
        params = db.query(Parameter).filter(Parameter.endpoint_id == ep.id).all()
        ep_dict = EndpointResponse.model_validate(ep)
        ep_dict.parameters = [ParameterResponse.model_validate(p) for p in params]
        result.append(ep_dict)
    return result


@router.get("/dtos", response_model=List[DTOResponse])
def list_dtos(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_project_or_404(project_id, current_user.id, db)
    return db.query(DTO).filter(DTO.project_id == project_id).all()
