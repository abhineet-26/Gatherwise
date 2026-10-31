import type { Request, Response, NextFunction } from 'express';

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  const requestId = req.headers['x-request-id'] || 'unknown';
  const status = typeof err === 'object' && err !== null && 'status' in err && typeof (err as { status: unknown }).status === 'number'
    ? (err as { status: number }).status
    : 500;

  const message = err instanceof Error ? err.message : 'Internal Server Error';

  // Never leak internal stack traces to the client
  res.status(status).json({
    error: status === 500 ? 'Internal Server Error' : message,
    requestId,
  });
}
