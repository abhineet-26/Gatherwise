export interface WeatherForecast {
  city: string;
  date: string;
  isWithinForecastWindow: boolean;
  forecast?: {
    tempMax: number;
    tempMin: number;
    precipitationProbabilityMax: number;
    precipitationSumMm: number;
    windMaxKmH: number;
    condition: string;
  };
  seasonalNote?: string;
  forecastAvailableDate?: string;
  risks: {
    type: 'rain' | 'heat' | 'wind';
    severity: 'high' | 'medium' | 'low';
    message: string;
  }[];
}
