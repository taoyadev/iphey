import type { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { logger, redactIp } from '../utils/logger';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const forwardedFor = (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim();
  const clientIp = redactIp(forwardedFor ?? req.socket.remoteAddress ?? undefined);
  const requestId = req.headers['x-request-id']?.toString() || randomUUID();

  // surface request id to downstream handlers and clients
  res.locals.requestId = requestId;
  res.setHeader('x-request-id', requestId);

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(
      {
        method: req.method,
        url: req.originalUrl ?? req.url,
        statusCode: res.statusCode,
        duration,
        ip: clientIp,
        requestId,
      },
      'Request completed'
    );
  });

  res.on('error', error => {
    const duration = Date.now() - start;
    logger.error(
      {
        method: req.method,
        url: req.originalUrl ?? req.url,
        duration,
        ip: clientIp,
        requestId,
        err: error,
      },
      'Request failed'
    );
  });

  next();
};
