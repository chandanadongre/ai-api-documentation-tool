import httpx
import json
from typing import AsyncGenerator, List, Dict
from app.core.config import settings

GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
MODEL = "llama3-8b-8192"


def _headers() -> Dict:
    return {
        "Authorization": f"Bearer {settings.GROQ_API_KEY}",
        "Content-Type": "application/json",
    }


async def chat_completion(messages: List[Dict]) -> str:
    """Single non-streaming completion. Returns full assistant message."""
    payload = {"model": MODEL, "messages": messages, "temperature": 0.4, "max_tokens": 1024}
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(GROQ_URL, headers=_headers(), json=payload)
        resp.raise_for_status()
        return resp.json()["choices"][0]["message"]["content"]


async def chat_stream(messages: List[Dict]) -> AsyncGenerator[str, None]:
    """Streaming completion — yields text chunks as SSE data lines."""
    payload = {
        "model": MODEL,
        "messages": messages,
        "temperature": 0.4,
        "max_tokens": 1024,
        "stream": True,
    }
    async with httpx.AsyncClient(timeout=60) as client:
        async with client.stream("POST", GROQ_URL, headers=_headers(), json=payload) as resp:
            resp.raise_for_status()
            async for line in resp.aiter_lines():
                if line.startswith("data: "):
                    data = line[6:]
                    if data == "[DONE]":
                        break
                    try:
                        chunk = json.loads(data)
                        delta = chunk["choices"][0]["delta"].get("content", "")
                        if delta:
                            yield delta
                    except (json.JSONDecodeError, KeyError):
                        continue
