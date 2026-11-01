from pydantic import BaseModel, Field
from datetime import datetime, timezone

class Capabilities(BaseModel):
    ai: bool = Field(..., description="Whether Gemini API key is configured and active")
    weather: bool = Field(default=True, description="Open-Meteo weather service availability")
    cloud: bool = Field(default=False, description="Cloud Firestore mode status")

class HealthResponse(BaseModel):
    status: str = "ok"
    capabilities: Capabilities
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

