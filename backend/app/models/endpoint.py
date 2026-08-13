import uuid
from sqlalchemy import Column, String, Boolean, Integer, DateTime, ForeignKey, func
from app.db.session import Base


class Endpoint(Base):
    __tablename__ = "endpoints"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    http_method = Column(String(10), nullable=False)   # GET | POST | PUT | DELETE | PATCH
    path = Column(String(500), nullable=False)
    controller_name = Column(String(255))
    method_name = Column(String(255))
    description = Column(String)
    auth_required = Column(Boolean, default=False)
    source_file = Column(String(500))
    line_number = Column(Integer)
    created_at = Column(DateTime, server_default=func.now())
