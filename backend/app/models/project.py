import uuid
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, func
from app.db.session import Base


class Project(Base):
    __tablename__ = "projects"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(String)
    source_type = Column(String(50), nullable=False)  # github | upload
    github_url = Column(String(500))
    status = Column(String(50), default="pending")    # pending | analyzing | ready | failed
    language = Column(String(50), default="java")
    endpoint_count = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
