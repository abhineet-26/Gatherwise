import time
import httpx
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, Optional
from ..schemas.weather import WeatherForecastResponse, DailyForecast, WeatherRisk

CACHE_TTL_SECONDS = 3 * 3600  # 3 hours
_weather_cache: Dict[str, Dict[str, Any]] = {}

INDIAN_CITIES_COORDS = {
    "pune": {"lat": 18.5204, "lon": 73.8567, "climate": "Tropical wet and dry; pleasant winters, heavy monsoon July-Sep"},
    "mumbai": {"lat": 19.0760, "lon": 72.8777, "climate": "Coastal humid; intense monsoon June-Sep, warm winters"},
    "delhi": {"lat": 28.6139, "lon": 77.2090, "climate": "Extreme climate; hot summers (May-June), cold winters (Dec-Jan)"},
    "jaipur": {"lat": 26.9124, "lon": 75.7873, "climate": "Semi-arid; hot summers, dry pleasant winters, peak wedding season Oct-March"},
    "bengaluru": {"lat": 12.9716, "lon": 77.5946, "climate": "Moderate pleasant climate year-round; sporadic evening showers"},
    "chennai": {"lat": 13.0827, "lon": 80.2707, "climate": "Tropical maritime; northeast monsoon rainfall Oct-Dec"},
    "kolkata": {"lat": 22.5726, "lon": 88.3639, "climate": "Subtropical; humid monsoon June-Sep, cool pleasant winter Dec-Jan"},
    "hyderabad": {"lat": 17.3850, "lon": 78.4867, "climate": "Tropical wet and dry; warm summers, mild dry winters"},
}

async def get_weather_forecast(
    city: str,
    event_date: str,
    setting: str = "outdoor",
    today_iso: Optional[str] = None
) -> WeatherForecastResponse:
    city_clean = city.strip().lower()
    cache_key = f"{city_clean}::{event_date}::{setting}"
    now = time.time()

    cached = _weather_cache.get(cache_key)
    if cached and cached["expires_at"] > now:
        return cached["data"]

    today = datetime.strptime(today_iso or datetime.now(timezone.utc).strftime("%Y-%m-%d"), "%Y-%m-%d").date()
    target_date = datetime.strptime(event_date, "%Y-%m-%d").date()
    days_ahead = (target_date - today).days

    city_data = INDIAN_CITIES_COORDS.get(
        city_clean,
        {
            "lat": 18.5204,
            "lon": 73.8567,
            "climate": "Typical Indian sub-tropical climate. Check seasonal rainfall before planning open lawns."
        }
    )

    is_within_window = 0 <= days_ahead <= 16
    daily_forecast: Optional[DailyForecast] = None
    risks = []

    if is_within_window:
        url = (
            f"https://api.open-meteo.com/v1/forecast"
            f"?latitude={city_data['lat']}&longitude={city_data['lon']}"
            f"&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max"
            f"&timezone=Asia%2FKolkata&start_date={event_date}&end_date={event_date}"
        )
        try:
            async with httpx.AsyncClient(timeout=4.0) as client:
                res = await client.get(url)
                if res.status_code == 200:
                    json_data = res.json()
                    daily = json_data.get("daily", {})
                    p_prob = daily.get("precipitation_probability_max", [10])[0] or 10
                    p_sum = daily.get("precipitation_sum", [0.0])[0] or 0.0
                    temp_max = daily.get("temperature_2m_max", [30.0])[0] or 30.0
                    temp_min = daily.get("temperature_2m_min", [20.0])[0] or 20.0
                    wind_max = daily.get("wind_speed_10m_max", [15.0])[0] or 15.0

                    cond = "Rain Expected" if p_prob > 50 else ("Partly Cloudy" if p_prob > 25 else "Clear Skies")
                    daily_forecast = DailyForecast(
                        tempMax=float(temp_max),
                        tempMin=float(temp_min),
                        precipitationProbabilityMax=int(p_prob),
                        precipitationSumMm=float(p_sum),
                        windMaxKmH=float(wind_max),
                        condition=cond
                    )

                    if setting in ("outdoor", "mixed"):
                        if p_prob >= 50 or p_sum >= 5.0:
                            risks.append(WeatherRisk(
                                type="rain",
                                severity="high",
                                message=f"High rain likelihood ({p_prob}% chance, {p_sum}mm). Secure waterproof lawn canopies and indoor backup banquet hall."
                            ))
                        elif p_prob >= 30:
                            risks.append(WeatherRisk(
                                type="rain",
                                severity="medium",
                                message=f"Moderate rain probability ({p_prob}%). Have umbrellas, covered walkways, and venue plastic tarps ready."
                            ))

                        if temp_max >= 38.0:
                            risks.append(WeatherRisk(
                                type="heat",
                                severity="high",
                                message=f"Extreme heat advisory (max {temp_max}°C). Install mist fans, air coolers, and ample hydration stations for daytime ceremonies."
                            ))

                        if wind_max >= 40.0:
                            risks.append(WeatherRisk(
                                type="wind",
                                severity="high",
                                message=f"High wind alert ({wind_max} km/h). Inspect tent anchor stakes, stage rigging, and floral arch ballast."
                            ))
        except Exception:
            # Graceful fallback to climate notes
            pass

    forecast_available_date = None
    if not is_within_window and days_ahead > 16:
        unlock_date = target_date - timedelta(days=16)
        forecast_available_date = unlock_date.strftime("%Y-%m-%d")

    result = WeatherForecastResponse(
        city=city,
        date=event_date,
        isWithinForecastWindow=bool(is_within_window and daily_forecast),
        forecast=daily_forecast,
        seasonalNote=city_data["climate"],
        forecastAvailableDate=forecast_available_date,
        risks=risks
    )

    _weather_cache[cache_key] = {
        "data": result,
        "expires_at": now + CACHE_TTL_SECONDS
    }

    return result
