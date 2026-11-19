import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';
import { AppError } from '../errors.js';

/** Validates and replaces req.body with the parsed value, or responds 400. */
export function validateBody(schema: ZodType): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const first = result.error.issues[0];
      const message = first ? `${first.path.join('.') || 'body'}: ${first.message}` : 'Invalid request.';
      return next(new AppError(400, 'invalid_request', message));
    }
    req.body = result.data;
    next();
  };
}
