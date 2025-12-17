import { createServer } from 'node:http';
import './utils/loadEnv';
import { createApp } from './app';
import { config } from './config';
import { logger } from './utils/logger';
import { cacheWarmer } from './utils/cacheWarming';
import { lookupIpInsight } from './services/ipService';

const app = createApp();
const server = createServer(app);

server.listen(config.PORT, () => {
  logger.info({ port: config.PORT }, 'iphey server listening');

  // Start cache warming in background after server is ready
  if (config.CACHE_WARMING_ENABLED) {
    cacheWarmer
      .warmCache(lookupIpInsight, {
        enabled: true,
        delayBetweenRequests: config.CACHE_WARMING_DELAY_MS,
      })
      .catch(error => {
        logger.error({ err: error }, 'Cache warming initialization failed');
      });
  }
});

const shutdown = (signal: string) => {
  logger.info({ signal }, 'shutting down gracefully');
  server.close(() => {
    process.exit(0);
  });
};

['SIGINT', 'SIGTERM'].forEach(sig => {
  process.on(sig, () => shutdown(sig));
});
