import path from 'node:path';
import fs from 'node:fs';
import './utils/loadEnv';
import express from 'express';
import compression from 'compression';
import helmet from 'helmet';
import cors from 'cors';
import { config } from './config';
import { requestLogger } from './middleware/requestLogger';
import { rateLimiter } from './middleware/rateLimiter';
import { apiRouter } from './routes';
import { notFound } from './middleware/notFound';
import { errorHandler } from './middleware/errorHandler';

export const createApp = () => {
  const app = express();

  // Disable x-powered-by header for security
  app.disable('x-powered-by');

  app.use(
    helmet({
      contentSecurityPolicy: config.NODE_ENV === 'development' ? false : undefined,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );
  app.use(
    cors({
      origin: config.CORS_ALLOWED_ORIGINS[0] === '*' ? true : config.CORS_ALLOWED_ORIGINS,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );
  app.use(rateLimiter);
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: false }));
  app.use(compression());
  app.use(requestLogger);

  const distDir = path.resolve(process.cwd(), 'dist/public');
  if (fs.existsSync(distDir)) {
    app.use(express.static(distDir, { index: false }));
  }

  app.use('/api', apiRouter);

  if (fs.existsSync(distDir)) {
    app.use((req, res, next) => {
      if (req.path.startsWith('/api') || req.path.startsWith('/v1')) {
        return next();
      }
      const indexFile = path.join(distDir, 'index.html');
      if (fs.existsSync(indexFile)) {
        return res.sendFile(indexFile);
      }
      return next();
    });
  }

  app.use(notFound);
  app.use(errorHandler);

  return app;
};
