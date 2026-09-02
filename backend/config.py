import os
from typing import List

class Settings:
    PROJECT_NAME: str = "VITALA Tactical Telemetry & AI API"
    VERSION: str = "2.4.0"
    API_V1_STR: str = "/api/v1"
    
    # CORS Configuration
    # Allows local dev servers + Vercel preview/production domains
    ALLOWED_ORIGINS_RAW: str = os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173,http://localhost:8000,http://127.0.0.1:8000"
    )
    
    @property
    def ALLOWED_ORIGINS(self) -> List[str]:
        return [origin.strip() for origin in self.ALLOWED_ORIGINS_RAW.split(",") if origin.strip()]
        
    ALLOW_ORIGIN_REGEX: str = os.getenv(
        "ALLOW_ORIGIN_REGEX",
        r"^https://.*\.vercel\.app$"
    )

settings = Settings()
