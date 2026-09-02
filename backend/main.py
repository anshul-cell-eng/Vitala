import sys
import os

# Ensure backend directory is in sys.path
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

try:
    from .config import settings
    from .routes import health, telemetry, predict
except ImportError:
    from config import settings
    from routes import health, telemetry, predict

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Multi-Modal Tactical Health & Disaster Resilience Telemetry API (SIH26181)",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware with configurable allowed origins and Vercel regex
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_origin_regex=settings.ALLOW_ORIGIN_REGEX,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Modular Routers
app.include_router(health.router)
app.include_router(telemetry.router)
app.include_router(predict.router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
