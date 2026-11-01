from typing import Optional, List, Literal
from pydantic import BaseModel, Field

class WeatherRisk(BaseModel):
    type: Literal["rain", "heat", "wind", "cold"]
    severity: Literal["low", "medium", "high"]
    message: str

class DailyForecast(BaseModel):
    tempMax: float
    tempMin: float
    precipitationProbabilityMax: int
    precipitationSumMm: float
    windMaxKmH: float
    condition: str

class WeatherForecastResponse(BaseModel):
    city: str
    date: str
    isWithinForecastWindow: bool
    forecast: Optional[DailyForecast] = None
    seasonalNote: Optional[str] = None
    forecastAvailableDate: Optional[str] = None
    risks: List[WeatherRisk] = Field(default_factory=list)
