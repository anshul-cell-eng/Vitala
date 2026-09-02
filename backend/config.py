import os
from typing import List
from pathlib import Path

# Load environment file if available
try:
    from dotenv import load_dotenv
    env_path = Path(__file__).resolve().parent.parent / ".env"
    if env_path.exists():
        load_dotenv(env_path)
except ImportError:
    pass

class Settings:
    PROJECT_NAME: str = "VITALA Tactical Telemetry & AI API"
    VERSION: str = "2.4.0"
    API_V1_STR: str = "/api/v1"
    
    # Server configuration
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "production")
    
    # CORS Configuration
    # Defaults include local dev frontend + any custom configured domains
    ALLOWED_ORIGINS_RAW: str = os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173,http://localhost:8000,http://127.0.0.1:8000"
    )
    
    @property
    def ALLOWED_ORIGINS(self) -> List[str]:
        return [origin.strip() for origin in self.ALLOWED_ORIGINS_RAW.split(",") if origin.strip()]
        
    # Allows all Vercel preview and production deployments by default
    ALLOW_ORIGIN_REGEX: str = os.getenv(
        "ALLOW_ORIGIN_REGEX",
        r"^https://.*\.vercel\.app$"
    )

settings = Settings()
