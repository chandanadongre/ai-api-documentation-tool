from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List
from app.db.session import get_db
from app.models.project import Project
from app.models.chat import ChatHistory
from app.models.user import User
from app.core.security import get_current_user
from app.services.groq_client import chat_completion, chat_stream
from app.services.prompt_builder import build_messages

router = APIRouter(prefix="/projects/{project_id}/ai", tags=["ai"])


class ChatRequest(BaseModel):
    message: str


class ChatMessage(BaseModel):
    role: str
    content: str
    id: str

    class Config:
        from_attributes = True


def _get_project_or_404(project_id: str, user_id: str, db: Session) -> Project:
    project = db.query(Project).filter(
        Project.id == project_id, Project.user_id == user_id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


def _load_history(project_id: str, user_id: str, db: Session) -> List[dict]:
    rows = (
        db.query(ChatHistory)
        .filter(ChatHistory.project_id == project_id, ChatHistory.user_id == user_id)
        .order_by(ChatHistory.created_at)
        .all()
    )
    return [{"role": r.role, "content": r.content} for r in rows]


@router.get("/history", response_model=List[ChatMessage])
def get_history(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_project_or_404(project_id, current_user.id, db)
    return (
        db.query(ChatHistory)
        .filter(ChatHistory.project_id == project_id, ChatHistory.user_id == current_user.id)
        .order_by(ChatHistory.created_at)
        .all()
    )


@router.delete("/history", status_code=204)
def clear_history(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_project_or_404(project_id, current_user.id, db)
    db.query(ChatHistory).filter(
        ChatHistory.project_id == project_id, ChatHistory.user_id == current_user.id
    ).delete()
    db.commit()


@router.post("/chat")
async def chat(
    project_id: str,
    payload: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = _get_project_or_404(project_id, current_user.id, db)
    history = _load_history(project_id, current_user.id, db)
    messages = build_messages(project.name, project_id, payload.message, history, db)

    answer = await chat_completion(messages)

    # Persist both turns
    db.add(ChatHistory(project_id=project_id, user_id=current_user.id, role="user", content=payload.message))
    db.add(ChatHistory(project_id=project_id, user_id=current_user.id, role="assistant", content=answer))
    db.commit()

    return {"role": "assistant", "content": answer}


@router.post("/chat/stream")
async def chat_stream_endpoint(
    project_id: str,
    payload: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = _get_project_or_404(project_id, current_user.id, db)
    history = _load_history(project_id, current_user.id, db)
    messages = build_messages(project.name, project_id, payload.message, history, db)

    # Save user message immediately
    db.add(ChatHistory(project_id=project_id, user_id=current_user.id, role="user", content=payload.message))
    db.commit()

    full_response = []

    async def event_generator():
        async for chunk in chat_stream(messages):
            full_response.append(chunk)
            yield f"data: {chunk}\n\n"

        # Save full assistant response after stream completes
        assistant_msg = "".join(full_response)
        db.add(ChatHistory(
            project_id=project_id, user_id=current_user.id,
            role="assistant", content=assistant_msg
        ))
        db.commit()
        yield "data: [DONE]\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")
