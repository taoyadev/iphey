import type { NextFunction, Request, Response } from 'express';
import { logger } from '../utils/logger';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const errorHandler = (err: Error | ApiError, _req: Request, res: Response, _next: NextFunction) => {
  const status = err instanceof ApiError ? err.status : 500;
  const requestId = res.locals.requestId as string | undefined;
  const payload = {
    error: err.message,
    details: err instanceof ApiError ? err.details : undefined,
    requestId,
  };

  if (status >= 500) {
    logger.error({ err, requestId }, 'Unhandled error');
  } else {
    logger.warn({ err, requestId }, 'Handled error');
  }

  res.status(status).json(payload);
};
