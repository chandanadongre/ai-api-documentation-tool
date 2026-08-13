from typing import List
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.models.knowledge_chunk import KnowledgeChunk
from app.services.chunker import build_chunks
from app.services.embedder import embed, embed_one


def index_project(project_id: str, db: Session) -> None:
    """Build chunks, embed them, and upsert into knowledge_chunks."""
    db.query(KnowledgeChunk).filter(KnowledgeChunk.project_id == project_id).delete()

    chunks = build_chunks(project_id, db)
    if not chunks:
        db.commit()
        return

    texts = [c["content"] for c in chunks]
    vectors = embed(texts)

    for chunk, vector in zip(chunks, vectors):
        db.add(KnowledgeChunk(
            project_id=project_id,
            chunk_type=chunk["chunk_type"],
            label=chunk["label"],
            content=chunk["content"],
            embedding=vector,
        ))
    db.commit()


def retrieve(project_id: str, question: str, db: Session, top_k: int = 5) -> List[str]:
    """Return top_k most relevant chunk contents for the given question."""
    q_vec = embed_one(question)

    # pgvector cosine distance operator: <=>
    rows = db.execute(
        text(
            "SELECT content FROM knowledge_chunks "
            "WHERE project_id = :pid "
            "ORDER BY embedding <=> CAST(:vec AS vector) "
            "LIMIT :k"
        ),
        {"pid": str(project_id), "vec": str(q_vec), "k": top_k},
    ).fetchall()

    return [row[0] for row in rows]
