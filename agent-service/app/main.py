"""
AI Career Agent - FastAPI Application
Main entry point for the Python agent service
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
import asyncio
import sys

# Windows-specific fix for "NotImplementedError" when using Playwright/subprocesses in asyncio
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

from core.config import get_settings
from core.database import DatabaseService


# Lifespan context manager for startup/shutdown events
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    from core.logging_config import setup_logging
    setup_logging()
    
    settings = get_settings()
    
    print("🚀 AI Career Agent Service starting...")
    print(f"📊 Model mode: {settings.default_model_mode}")
    print(f"🤖 Model: {settings.current_model}")
    
    # Initialize database pool
    await DatabaseService.get_pool()
    print("✅ Database connection pool initialized")
    
    yield
    
    # Shutdown
    print("👋 AI Career Agent Service shutting down...")
    await DatabaseService.close_pool()
    print("✅ Database connections closed")


# Create FastAPI app
app = FastAPI(
    title="AI Career Agent API",
    description="AI-powered job search automation with resume tailoring and auto-application",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS
settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi import Request
import sys

@app.middleware("http")
async def log_requests(request: Request, call_next):
    response = await call_next(request)
    
    # Format to exactly match Uvicorn's default access log
    client_host = request.client.host if request.client else "127.0.0.1"
    client_port = request.client.port if request.client else "0"
    
    status_text = "OK" if response.status_code < 400 else "Internal Server Error" if response.status_code == 500 else "Not Found" if response.status_code == 404 else ""
    log_line = f'INFO:     {client_host}:{client_port} - "{request.method} {request.url.path} HTTP/{request.scope.get("http_version", "1.1")}" {response.status_code} {status_text}'
    
    import sys
    import logging
    logger = logging.getLogger("uvicorn.access")
    
    # Print to stdout explicitly and also log via uvicorn.access logger
    print(log_line, file=sys.stdout, flush=True)
    logger.info(log_line)
    
    return response

# Health check endpoints
@app.get("/")
async def root():
    settings = get_settings()
    return {
        "status": "healthy",
        "service": "AI Career Agent",
        "version": "1.0.0",
        "model_mode": settings.default_model_mode,
        "model": settings.current_model,
    }

@app.get("/health")
async def health_check():
    settings = get_settings()
    
    # Check database
    db_status = "unknown"
    try:
        pool = await DatabaseService.get_pool()
        async with pool.acquire() as conn:
            await conn.execute("SELECT 1")
            db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)}"
    
    return {
        "status": "ok",
        "database": db_status,
        "llm": f"openrouter/{settings.current_model}",
    }


# Import and include routers
from app.routers import (
    agent, jobs, resumes, applications, linkedin, 
    dashboard, interview, settings, insights, artifacts
)

app.include_router(agent.router, prefix="/api/agent", tags=["Agent Missions"])
app.include_router(jobs.router, prefix="/api/jobs", tags=["Jobs"])
app.include_router(resumes.router, prefix="/api/resumes", tags=["Resumes"])
app.include_router(applications.router, prefix="/api/applications", tags=["Applications"])
app.include_router(linkedin.router, prefix="/api/linkedin", tags=["LinkedIn"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(interview.router, prefix="/api/interview", tags=["Interview"])
app.include_router(settings.router, prefix="/api/settings", tags=["Settings"])
app.include_router(insights.router, prefix="/api/insights", tags=["Insights"])
app.include_router(artifacts.router, prefix="/api/artifacts", tags=["Artifacts"])


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=settings.port,
        reload=True,
        reload_excludes=["*.log"]
    )
