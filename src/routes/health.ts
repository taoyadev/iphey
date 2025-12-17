import { Router } from 'express';
import { appVersion } from '../utils/version';
import { config } from '../config';
import { verifyRadarToken } from '../clients/cloudflareRadarClient';
import { cacheWarmer } from '../utils/cacheWarming';
import { EnhancedIpService } from '../services/enhancedIpService';
import { requestExecutionTime } from '../utils/timing';

export const healthRouter = Router();

healthRouter.get('/health', async (_req, res) => {
  const { durationMs: radarLatency, result: radarHealthy } =
    config.CLOUDFLARE_ACCOUNT_ID && config.CLOUDFLARE_RADAR_TOKEN
      ? await requestExecutionTime(() => verifyRadarToken())
      : { durationMs: null, result: null };

  const enhancedIpService = new EnhancedIpService();
  const serviceStatus = await enhancedIpService.getServiceStatus();

  res.json({
    status: 'ok',
    version: appVersion,
    env: config.NODE_ENV,
    uptime: process.uptime(),
    requestId: res.locals.requestId,
    ipinfoConfigured: Boolean(config.IPINFO_TOKEN),
    radarHealthy,
    metrics: {
      radarLatencyMs: radarLatency,
    },
    services: serviceStatus,
    cache: {
      backend: config.CACHE_BACKEND,
      warmingEnabled: config.CACHE_WARMING_ENABLED,
      warmingInProgress: cacheWarmer.isInProgress(),
      warmedCount: cacheWarmer.getWarmedCount(),
    },
    timestamp: Date.now(),
  });
});
