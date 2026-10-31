import express, { type Express } from 'express';
import cors from 'cors';
import { requestId } from './middleware/requestId';
import { securityHeaders } from './middleware/security';
import { createRateLimiter } from './middleware/rateLimit';
import { errorHandler } from './middleware/errorHandler';
import { createHealthRouter } from './routes/health';
import { getEnv } from './config/env';

export interface AppDependencies {
  // swappable dependencies for testing and ports
  env?: ReturnType<typeof getEnv>;
}

export function createApp(_deps: AppDependencies = {}): Express {
  const app = express();

  // Core middleware
  app.use(requestId);
  app.use(securityHeaders());
  app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id'],
  }));
  app.use(createRateLimiter());
  app.use(express.json({ limit: '1mb' }));

  // Routes
  app.use('/api/health', createHealthRouter());

  // Error handling
  app.use(errorHandler);

  return app;
}
