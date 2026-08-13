from functools import lru_cache
from typing import List
from sentence_transformers import SentenceTransformer


@lru_cache(maxsize=1)
def _model() -> SentenceTransformer:
    return SentenceTransformer("all-MiniLM-L6-v2")


def embed(texts: List[str]) -> List[List[float]]:
    """Return a list of 384-dim float vectors for the given texts."""
    return _model().encode(texts, convert_to_numpy=True).tolist()


def embed_one(text: str) -> List[float]:
    return embed([text])[0]
