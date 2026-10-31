import { daysBetween, asIsoDate } from 'shared/domain/time/dates';
import type { WeatherForecast } from 'shared/domain/weather/types';

export type { WeatherForecast };

interface CacheEntry {
  data: WeatherForecast;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 3 * 60 * 60 * 1000; // 3 hours

// Representative coordinates for major Indian cities
const INDIAN_CITIES_COORDS: Record<string, { lat: number; lon: number; climate: string }> = {
  pune: { lat: 18.5204, lon: 73.8567, climate: 'Tropical wet and dry; pleasant winters, heavy monsoon July-Sep' },
  mumbai: { lat: 19.0760, lon: 72.8777, climate: 'Coastal humid; intense monsoon June-Sep, warm winters' },
  delhi: { lat: 28.6139, lon: 77.2090, climate: 'Extreme climate; hot summers (May-June), cold winters (Dec-Jan)' },
  jaipur: { lat: 26.9124, lon: 75.7873, climate: 'Semi-arid; hot summers, dry pleasant winters, peak wedding season Oct-March' },
  bengaluru: { lat: 12.9716, lon: 77.5946, climate: 'Moderate pleasant climate year-round; sporadic evening showers' },
  chennai: { lat: 13.0827, lon: 80.2707, climate: 'Tropical maritime; northeast monsoon rainfall Oct-Dec' },
  kolkata: { lat: 22.5726, lon: 88.3639, climate: 'Subtropical; humid monsoon June-Sep, cool pleasant winter Dec-Jan' },
  hyderabad: { lat: 17.3850, lon: 78.4867, climate: 'Tropical wet and dry; warm summers, mild dry winters' },
};

export async function fetchWeatherForecast(
  city: string,
  eventDate: string,
  setting: string = 'outdoor',
  todayIso?: string
): Promise<WeatherForecast> {
  const cityKey = city.trim().toLowerCase();
  const cacheKey = `${cityKey}::${eventDate}::${setting}`;
  const now = Date.now();

  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    return cached.data;
  }

  const today = asIsoDate(todayIso || new Date().toISOString().slice(0, 10));
  const daysAhead = daysBetween(today, asIsoDate(eventDate));

  const cityData = INDIAN_CITIES_COORDS[cityKey] || {
    lat: 18.5204,
    lon: 73.8567,
    climate: 'Typical Indian sub-tropical climate. Check seasonal rainfall before planning open lawns.',
  };

  // Open-Meteo 16-day forecast window limit
  const isWithinWindow = daysAhead >= 0 && daysAhead <= 16;

  let forecast: WeatherForecast['forecast'];
  const risks: WeatherForecast['risks'] = [];

  if (isWithinWindow) {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${cityData.lat}&longitude=${cityData.lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max&timezone=Asia%2FKolkata&start_date=${eventDate}&end_date=${eventDate}`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const json = (await res.json()) as any;
        const daily = json.daily || {};
        const pProb = daily.precipitation_probability_max?.[0] ?? 10;
        const pSum = daily.precipitation_sum?.[0] ?? 0;
        const tempMax = daily.temperature_2m_max?.[0] ?? 30;
        const tempMin = daily.temperature_2m_min?.[0] ?? 20;
        const windMax = daily.wind_speed_10m_max?.[0] ?? 15;

        forecast = {
          tempMax,
          tempMin,
          precipitationProbabilityMax: pProb,
          precipitationSumMm: pSum,
          windMaxKmH: windMax,
          condition: pProb > 50 ? 'Rain Expected' : pProb > 25 ? 'Partly Cloudy' : 'Clear Skies',
        };

        // Evaluate Weather Risk Rules (DOMAIN-MODEL.md §5.13)
        if (setting === 'outdoor' || setting === 'mixed') {
          if (pProb >= 50 || pSum >= 5) {
            risks.push({
              type: 'rain',
              severity: 'high',
              message: `High rain likelihood (${pProb}% chance, ${pSum}mm). Secure waterproof lawn canopies and indoor backup banquet hall.`,
            });
          } else if (pProb >= 30) {
            risks.push({
              type: 'rain',
              severity: 'medium',
              message: `Moderate rain probability (${pProb}%). Have umbrellas, covered walkways, and venue plastic tarps ready.`,
            });
          }

          if (tempMax >= 38) {
            risks.push({
              type: 'heat',
              severity: 'high',
              message: `Extreme heat advisory (max ${tempMax}°C). Install mist fans, air coolers, and ample hydration stations for daytime ceremonies.`,
            });
          }

          if (windMax >= 40) {
            risks.push({
              type: 'wind',
              severity: 'high',
              message: `High wind alert (${windMax} km/h). Inspect tent anchor stakes, stage rigging, and floral arch ballast.`,
            });
          }
        }
      }
    } catch (err) {
      console.warn(`[OpenMeteo] Live forecast failed for ${city}, using climate fallback:`, (err as any)?.message);
    }
  }

  // Outside 16-day window: calculate date when forecast unlocks
  let forecastAvailableDate: string | undefined;
  if (!isWithinWindow && daysAhead > 16) {
    const unlockDate = new Date(eventDate);
    unlockDate.setDate(unlockDate.getDate() - 16);
    forecastAvailableDate = unlockDate.toISOString().slice(0, 10);
  }

  const result: WeatherForecast = {
    city,
    date: eventDate,
    isWithinForecastWindow: isWithinWindow && Boolean(forecast),
    forecast,
    seasonalNote: cityData.climate,
    forecastAvailableDate,
    risks,
  };

  cache.set(cacheKey, { data: result, expiresAt: now + CACHE_TTL_MS });
  return result;
}
