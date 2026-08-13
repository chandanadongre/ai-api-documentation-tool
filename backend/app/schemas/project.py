from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None
    source_type: str  # github | upload
    github_url: Optional[str] = None


class ProjectResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    source_type: str
    github_url: Optional[str]
    status: str
    language: str
    endpoint_count: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
