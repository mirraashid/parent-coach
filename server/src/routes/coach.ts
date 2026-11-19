import { Router } from 'express';
import type { CoachService } from '../coach/coachService.js';
import { CoachRequestSchema, type CoachRequest } from '../coach/types.js';
import { validateBody } from '../middleware/validateBody.js';

export function createCoachRouter(coach: CoachService): Router {
  const router = Router();

  router.post('/', validateBody(CoachRequestSchema), async (req, res) => {
    const { messages } = req.body as CoachRequest;
    const result = await coach.reply(messages);
    res.json(result);
  });

  return router;
}
