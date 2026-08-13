from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.session import Base, engine
from app.routers import auth, projects

# Create all tables on startup (use alembic for production migrations)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="API Documentation AI",
    description="AI-powered API discovery, documentation and testing platform",
    version="0.1.0",
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


@app.get("/health")
def health():
    return {"status": "ok", "service": "APIForge AI"}
