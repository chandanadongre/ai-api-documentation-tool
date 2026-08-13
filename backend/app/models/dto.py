import uuid
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import JSONB
from app.db.session import Base


class Parameter(Base):
    __tablename__ = "parameters"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    endpoint_id = Column(String, ForeignKey("endpoints.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    param_type = Column(String(50), nullable=False)   # path | query | header | body
    data_type = Column(String(100))
    required = Column(Boolean, default=False)
    description = Column(String)


class DTO(Base):
    __tablename__ = "dtos"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    dto_type = Column(String(50))                     # request | response | model
    source_file = Column(String(500))
    fields = Column(JSONB)                            # [{name, type, required}]
    created_at = Column(DateTime, server_default=func.now())
