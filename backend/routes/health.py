from fastapi import APIRouter

try:
    from ..config import settings
except ImportError:
    from config import settings

router = APIRouter(tags=["Health & Status"])

@router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION
    }

@router.get("/api/status")
async def api_status():
    return {
        "status": "online",
        "service": "VITALA Backend",
        "telemetry_protocol": "REST + WebSockets (RFC 6455)"
    }
