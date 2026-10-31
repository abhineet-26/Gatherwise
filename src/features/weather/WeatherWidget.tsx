import React, { useState, useEffect } from 'react';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { useUiStore } from '../../store/uiStore';
import type { WeatherForecast } from 'shared/domain/weather/types';
import {
  CloudRain,
  Sun,
  Wind,
  Thermometer,
  AlertTriangle,
  Calendar,
  Sparkles,
  Info,
} from 'lucide-react';

export const WeatherWidget: React.FC = () => {
  const { workspace } = useWorkspaceStore();
  const today = useUiStore(s => s.getEffectiveToday());
  const [data, setData] = useState<WeatherForecast | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!workspace) return;

    let isMounted = true;
    setLoading(true);

    fetch(
      `/api/weather?city=${encodeURIComponent(workspace.event.city)}&date=${workspace.event.date}&setting=${workspace.event.setting || 'outdoor'}&today=${today}`
    )
      .then(res => (res.ok ? res.json() : null))
      .then(forecast => {
        if (isMounted && forecast) {
          setData(forecast);
        }
      })
      .catch(() => {
        // Fallback gracefully
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [workspace?.event.city, workspace?.event.date, workspace?.event.setting, today]);

  if (!workspace) return null;

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <CloudRain className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary">Weather Watch</h3>
            <p className="text-xs text-text-muted">
              {workspace.event.city} • {workspace.event.setting || 'Outdoor'} Venue
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-surface-subtle px-2 py-0.5 text-[11px] font-medium text-text-muted border border-border">
          <Sparkles className="h-3 w-3 text-secondary" /> Open-Meteo
        </span>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-xs text-text-muted py-4">
          <span className="animate-spin">⏳</span>
          <span>Fetching meteorological forecasts for {workspace.event.city}...</span>
        </div>
      ) : data?.isWithinForecastWindow && data.forecast ? (
        <div className="space-y-3">
          {/* Main Forecast Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
            <div className="rounded-xl bg-surface-subtle p-2.5 border border-border">
              <span className="text-[10px] text-text-muted uppercase font-medium block">Condition</span>
              <div className="mt-1 flex items-center justify-center gap-1 font-semibold text-sm text-text-primary">
                {data.forecast.precipitationProbabilityMax > 40 ? (
                  <CloudRain className="h-4 w-4 text-blue-500" />
                ) : (
                  <Sun className="h-4 w-4 text-amber-500" />
                )}
                <span>{data.forecast.condition}</span>
              </div>
            </div>

            <div className="rounded-xl bg-surface-subtle p-2.5 border border-border">
              <span className="text-[10px] text-text-muted uppercase font-medium block">Rain Prob</span>
              <div className="mt-1 font-semibold text-sm text-text-primary flex items-center justify-center gap-1">
                <CloudRain className="h-3.5 w-3.5 text-blue-500" />
                <span>{data.forecast.precipitationProbabilityMax}%</span>
              </div>
            </div>

            <div className="rounded-xl bg-surface-subtle p-2.5 border border-border">
              <span className="text-[10px] text-text-muted uppercase font-medium block">Temperature</span>
              <div className="mt-1 font-semibold text-sm text-text-primary flex items-center justify-center gap-1">
                <Thermometer className="h-3.5 w-3.5 text-amber-600" />
                <span>{data.forecast.tempMax}° / {data.forecast.tempMin}°C</span>
              </div>
            </div>

            <div className="rounded-xl bg-surface-subtle p-2.5 border border-border">
              <span className="text-[10px] text-text-muted uppercase font-medium block">Max Wind</span>
              <div className="mt-1 font-semibold text-sm text-text-primary flex items-center justify-center gap-1">
                <Wind className="h-3.5 w-3.5 text-text-muted" />
                <span>{data.forecast.windMaxKmH} km/h</span>
              </div>
            </div>
          </div>

          {/* Active Weather Advisories */}
          {data.risks.length > 0 ? (
            <div className="space-y-1.5">
              {data.risks.map((risk, idx) => (
                <div
                  key={idx}
                  className={`rounded-lg p-2.5 text-xs flex items-start gap-2 border ${
                    risk.severity === 'high'
                      ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30'
                      : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30'
                  }`}
                >
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span className="leading-snug">{risk.message}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-2 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
              <Sun className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>Favourable weather anticipated. No severe rain, heat or wind risks detected.</span>
            </div>
          )}
        </div>
      ) : (
        /* Outside 16-day window */
        <div className="space-y-3">
          <div className="rounded-xl bg-surface-subtle p-3 border border-border space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-text-primary">
              <Info className="h-3.5 w-3.5 text-primary" />
              <span>Seasonal Climate Profile for {workspace.event.city}</span>
            </div>
            <p className="text-xs text-text-muted leading-relaxed">
              {data?.seasonalNote || 'Sub-tropical climate; pleasant winters, heavy monsoon July-Sep.'}
            </p>
          </div>

          {data?.forecastAvailableDate && (
            <div className="flex items-center gap-2 text-xs text-text-muted px-1">
              <Calendar className="h-3.5 w-3.5 text-primary" />
              <span>
                Live 16-day numerical weather forecast unlocks on{' '}
                <strong className="text-text-primary">{data.forecastAvailableDate}</strong>.
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
