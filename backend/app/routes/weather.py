from typing import Optional
from fastapi import APIRouter, Query, HTTPException
from ..schemas.weather import WeatherForecastResponse
from ..services.weather_service import get_weather_forecast

router = APIRouter(prefix="/api/weather", tags=["weather"])

@router.get("", response_model=WeatherForecastResponse)
async def get_weather(
    city: str = Query(..., min_length=1, max_length=60),
    date: str = Query(..., pattern=r"^\d{4}-\d{2}-\d{2}$"),
    setting: str = Query(default="outdoor"),
    today: Optional[str] = Query(default=None, pattern=r"^\d{4}-\d{2}-\d{2}$")
) -> WeatherForecastResponse:
    try:
        return await get_weather_forecast(city=city, event_date=date, setting=setting, today_iso=today)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to fetch forecast: {str(exc)}")
