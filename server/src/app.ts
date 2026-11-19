import { existsSync } from 'node:fs';
import path from 'node:path';
import express from 'express';
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
import type { CoachService } from './coach/coachService.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { createCoachRouter } from './routes/coach.js';

export interface AppOptions {
  coach: CoachService;
  providerInfo: { name: string; model: string };
  /** Requests per minute per IP on /api/coach. */
  rateLimitPerMinute?: number;
  /** Folder with the built React app; served when present. */
  clientDistDir?: string;
}

export function createApp({
  coach,
  providerInfo,
  rateLimitPerMinute = 20,
  clientDistDir = path.resolve(import.meta.dirname, '../../client/dist'),
}: AppOptions) {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(express.json({ limit: '64kb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', provider: providerInfo.name, model: providerInfo.model });
  });

  app.use(
    '/api/coach',
    rateLimit({
      windowMs: 60_000,
      limit: rateLimitPerMinute,
      standardHeaders: 'draft-8',
      legacyHeaders: false,
      message: {
        error: { code: 'rate_limited', message: 'Too many messages in a short time. Please wait a minute.' },
      },
    }),
    createCoachRouter(coach),
  );

  app.use('/api', notFoundHandler);

  // In production the API also serves the built client (single origin, no CORS).
  if (existsSync(clientDistDir)) {
    app.use(express.static(clientDistDir, { index: false, maxAge: '1h' }));
    app.get('/{*splat}', (_req, res) => {
      res.sendFile(path.join(clientDistDir, 'index.html'));
    });
  }

  app.use(errorHandler);
  return app;
}
