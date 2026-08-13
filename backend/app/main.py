from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.session import Base, engine
from app.models import user, project, endpoint, dto, chat, knowledge_chunk, test_suite  # noqa: ensure all models registered
from app.routers import auth, projects, repositories, endpoints, openapi_router, ai, tests

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="API Documentation AI",
    description="AI-powered API discovery, documentation and testing platform",
    version="0.6.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(projects.router)
app.include_router(repositories.router)
app.include_router(endpoints.router)
app.include_router(openapi_router.router)
app.include_router(ai.router)
app.include_router(tests.router)


@app.get("/health")
def health():
    return {"status": "ok", "service": "API Documentation AI", "version": "0.3.0"}
