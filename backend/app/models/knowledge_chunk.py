import uuid
from sqlalchemy import Column, String, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from pgvector.sqlalchemy import Vector
from app.db.session import Base


class KnowledgeChunk(Base):
    __tablename__ = "knowledge_chunks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    chunk_type = Column(String(50))   # "endpoint" | "dto"
    label = Column(String(255))       # e.g. "POST /api/users"
    content = Column(Text, nullable=False)
    embedding = Column(Vector(384))   # all-MiniLM-L6-v2 dimension
