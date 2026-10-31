import { describe, expect, it } from 'vitest';
import type { Server } from 'http';
import { createApp } from '../app';

describe('GET /api/health', () => {
  it('boots on an ephemeral port and reports capabilities with ai: false when key is absent', async () => {
    const app = createApp();
    const server: Server = await new Promise((resolve) => {
      const s = app.listen(0, () => resolve(s));
    });

    try {
      const address = server.address();
      if (!address || typeof address === 'string') {
        throw new Error('Expected address info');
      }

      const res = await fetch(`http://127.0.0.1:${address.port}/api/health`);
      expect(res.status).toBe(200);

      const body = await res.json() as { status: string; capabilities: Record<string, boolean>; timestamp: string };
      expect(body.status).toBe('ok');
      expect(body.capabilities).toEqual({
        ai: false,
        weather: true,
        cloud: false,
      });
      expect(typeof body.timestamp).toBe('string');
    } finally {
      await new Promise((resolve) => server.close(resolve));
    }
  });
});
