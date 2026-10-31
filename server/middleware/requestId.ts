import type { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

export function requestId(req: Request, res: Response, next: NextFunction): void {
  const existing = req.headers['x-request-id'];
  const id = typeof existing === 'string' && existing.length > 0 ? existing : crypto.randomUUID();
  req.headers['x-request-id'] = id;
  res.setHeader('x-request-id', id);
  next();
}
