from fastapi import APIRouter

try:
    from ..config import settings
except ImportError:
    from config import settings

router = APIRouter(tags=["Health & Status"])

@router.get("/")
async def root_status():
    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs": "/docs",
        "health": "/health",
        "status_endpoint": "/api/status",
        "active_nodes_endpoint": "/api/nodes",
        "dashboard_websocket": "/ws/dashboard"
    }

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
