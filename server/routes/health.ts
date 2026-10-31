import { Router } from 'express';
import { getEnv } from '../config/env';

export function createHealthRouter(): Router {
  const router = Router();

  router.get('/', (_req, res) => {
    const env = getEnv();
    const hasAiKey = Boolean(env.GEMINI_API_KEY && env.GEMINI_API_KEY.trim().length > 0);

    res.json({
      status: 'ok',
      capabilities: {
        ai: hasAiKey,
        weather: true,
        cloud: false,
      },
      timestamp: new Date().toISOString(),
    });
  });

  return router;
}
