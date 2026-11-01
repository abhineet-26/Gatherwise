from fastapi import APIRouter
from ..config import settings
from ..schemas.health import HealthResponse, Capabilities

router = APIRouter(prefix="/api/health", tags=["health"])

@router.get("", response_model=HealthResponse)
def get_health() -> HealthResponse:
    has_gemini = bool(settings.GEMINI_API_KEY and len(settings.GEMINI_API_KEY.strip()) > 0)
    return HealthResponse(
        status="ok",
        capabilities=Capabilities(
            ai=has_gemini,
            weather=True,
            cloud=False
        )
    )
