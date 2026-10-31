import { Router } from 'express';
import { z } from 'zod';
import { fetchWeatherForecast } from '../integrations/openMeteo';

const weatherQuerySchema = z.object({
  city: z.string().min(1).max(60),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  setting: z.enum(['indoor', 'outdoor', 'mixed', 'home']).default('outdoor'),
  today: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export function createWeatherRouter(): Router {
  const router = Router();

  router.get('/', async (req, res, next) => {
    try {
      const parsed = weatherQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        return res.status(400).json({
          error: 'Invalid weather query parameters',
          details: parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`),
        });
      }

      const { city, date, setting, today } = parsed.data;
      const forecast = await fetchWeatherForecast(city, date, setting, today);
      return res.json(forecast);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
