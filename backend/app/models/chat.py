import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, func
from app.db.session import Base


class ChatHistory(Base):
    __tablename__ = "chat_history"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    role = Column(String(20), nullable=False)   # user | assistant
    content = Column(String, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
