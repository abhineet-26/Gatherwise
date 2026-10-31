import { Router } from 'express';
import { z } from 'zod';
import { AiContextSchema } from '../ai/types';
import { defaultOrchestrator, AiOrchestrator } from '../ai/orchestrator';

const chatRequestSchema = z.object({
  message: z.string().min(1).max(500),
  context: AiContextSchema,
});

const ideasRequestSchema = z.object({
  context: AiContextSchema,
  query: z.string().max(300).optional(),
});

export function createAiRouter(orchestrator: AiOrchestrator = defaultOrchestrator): Router {
  const router = Router();

  router.post('/chat', async (req, res, next) => {
    try {
      const parsed = chatRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: 'Invalid AI chat request',
          details: parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`),
        });
      }
      const response = await orchestrator.processChat(parsed.data.message, parsed.data.context);
      return res.json(response);
    } catch (err) {
      next(err);
    }
  });

  router.post('/ideas', (req, res, next) => {
    try {
      const parsed = ideasRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: 'Invalid ideas request',
          details: parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`),
        });
      }
      const ideas = orchestrator.getCuratedIdeas(parsed.data.context, parsed.data.query);
      return res.json({ ideas });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
