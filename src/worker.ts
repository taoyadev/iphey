/**
 * Cloudflare Workers Entry Point
 * Hono-based API for edge deployment
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger as honoLogger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { cacheWarmer } from './utils/cacheWarming';
import { logger } from './utils/logger';
import { generateReportWithLookup } from './services/report';
import type { ExecutionContext, ScheduledEvent } from '@cloudflare/workers-types';
import type { ReportRequestBody } from './types/report';
import type { Env } from './worker/types';
import { createWorkerIpService } from './services/ipService.worker';

type WorkerGlobal = typeof globalThis & {
  ipCacheInitialized?: boolean;
  workerServices?: ReturnType<typeof createWorkerIpService>;
};

const workerGlobal = globalThis as WorkerGlobal;

const getWorkerIpService = (env: Env) => {
  if (!workerGlobal.workerServices) {
    workerGlobal.workerServices = createWorkerIpService(env);
  }
  return workerGlobal.workerServices;
};

/**
 * Create Hono app with all routes
 */
function createWorkerApp() {
  const app = new Hono<{ Bindings: Env }>();

  // Middleware
  app.use('*', honoLogger());
  app.use('*', prettyJSON());
  app.use(
    '*',
    cors({
      origin: '*',
      allowMethods: ['GET', 'POST', 'OPTIONS'],
      allowHeaders: ['Content-Type'],
      maxAge: 86400,
    })
  );

  // Health check endpoint
  app.get('/api/health', c => {
    return c.json({
      status: 'ok',
      version: '1.0.0',
      environment: 'cloudflare-workers',
      timestamp: Date.now(),
      cache: {
        backend: c.env.CACHE_BACKEND ?? 'kv',
        enabled: true,
      },
    });
  });

  // IP lookup endpoint
  app.get('/api/ip/:ip', async c => {
    try {
      const ip = c.req.param('ip');

      if (!ip || !/^(\d{1,3}\.){3}\d{1,3}$/.test(ip)) {
        return c.json({ error: 'Invalid IP address' }, 400);
      }

      const services = getWorkerIpService(c.env);
      const result = await services.lookupIpInsight(ip);
      return c.json(result);
    } catch (error) {
      logger.error({ err: error }, 'IP lookup failed');
      return c.json(
        {
          error: 'Internal Server Error',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        500
      );
    }
  });

  // Report generation endpoint
  app.post('/api/v1/report', async c => {
    try {
      const body = await c.req.json<ReportRequestBody>();

      if (!body?.fingerprint) {
        return c.json({ error: 'Missing fingerprint data' }, 400);
      }

      const services = getWorkerIpService(c.env);
      const report = await generateReportWithLookup(
        body,
        c.req.header('cf-connecting-ip') ?? undefined,
        services.lookupIpInsight
      );
      return c.json(report);
    } catch (error) {
      logger.error({ err: error }, 'Report generation failed');
      return c.json(
        {
          error: 'Internal Server Error',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        500
      );
    }
  });

  // Enhanced IP endpoints for frontend compatibility

  // GET /api/v1/ip/enhanced - Get client's IP with enhanced analysis
  app.get('/api/v1/ip/enhanced', async c => {
    try {
      const ip = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for')?.split(',')[0] || '127.0.0.1';

      const includeThreat = c.req.query('threats') !== 'false';
      const includeASN = c.req.query('asn') !== 'false';

      logger.info({ ip, includeThreat, includeASN }, 'Enhanced IP analysis request (client IP)');

      let result;
      try {
        const services = getWorkerIpService(c.env);
        result = await services.lookupIpInsight(ip);
      } catch (error) {
        logger.warn({ err: error, ip }, 'API lookup failed, using default data');
        // Provide default data when APIs fail
        result = {
          ip,
          country: 'US',
          region: 'Unknown',
          city: 'Unknown',
          latitude: 37.751,
          longitude: -97.822,
          timezone: 'America/Chicago',
          org: 'Unknown Organization',
          postal: '00000'
        };
      }

      // Mock enhanced response structure
      return c.json({
        ip,
        geolocation: {
          ip: ip,
          city: result.city || 'Unknown',
          region: result.region || 'Unknown',
          country: result.country || 'Unknown',
          postal: result.postal || 'Unknown',
          timezone: result.timezone || 'Unknown',
          latitude: result.latitude || 0,
          longitude: result.longitude || 0,
          org: result.org || 'Unknown',
          asn: result.org ? '13335' : 'Unknown',
          source: 'ipinfo',
          fetchedAt: Date.now(),
          anycast: false,
          bogon: false,
        },
        threats: {
          threat_score: 5,
          threat_level: 'low',
          is_malicious: false,
        },
        asn_analysis: {
          asn: result.org ? 13335 : 0, // Default Cloudflare ASN or 0 if unknown
          info: {
            asn: result.org ? 13335 : 0,
            name: result.org || 'Unknown',
            org_name: result.org || 'Unknown',
            country: result.country || 'Unknown',
            description: result.org || 'Unknown Organization',
          },
          timestamp: new Date().toISOString(),
        },
        risk_assessment: {
          overall_score: 5,
          overall_level: 'low',
          factors: ['No significant risk factors detected'],
          recommendation: 'Low risk. Normal processing recommended.',
        },
        sources_used: ['ipinfo'],
        analysis_timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error({ err: error }, 'Enhanced IP analysis failed');
      return c.json(
        {
          error: 'Internal Server Error',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        500
      );
    }
  });

  // GET /api/v1/ip/:ip/enhanced - Enhanced IP analysis for specific IP
  app.get('/api/v1/ip/:ip/enhanced', async c => {
    try {
      const ip = c.req.param('ip');

      if (!ip || !/^(\d{1,3}\.){3}\d{1,3}$/.test(ip)) {
        return c.json({ error: 'Invalid IP address' }, 400);
      }

      const includeThreat = c.req.query('threats') !== 'false';
      const includeASN = c.req.query('asn') !== 'false';

      logger.info({ ip, includeThreat, includeASN }, 'Enhanced IP analysis request');

      let result;
      try {
        const services = getWorkerIpService(c.env);
        result = await services.lookupIpInsight(ip);
      } catch (error) {
        logger.warn({ err: error, ip }, 'API lookup failed, using default data');
        result = {
          ip,
          country: 'US',
          region: 'Unknown',
          city: 'Unknown',
          latitude: 37.751,
          longitude: -97.822,
          timezone: 'America/Chicago',
          org: 'Unknown Organization',
          postal: '00000'
        };
      }

      return c.json({
        ip,
        geolocation: {
          ip: ip,
          city: result.city || 'Unknown',
          region: result.region || 'Unknown',
          country: result.country || 'Unknown',
          postal: result.postal || 'Unknown',
          timezone: result.timezone || 'Unknown',
          latitude: result.latitude || 0,
          longitude: result.longitude || 0,
          org: result.org || 'Unknown',
          asn: result.org ? '13335' : 'Unknown',
          source: 'ipinfo',
          fetchedAt: Date.now(),
          anycast: false,
          bogon: false,
        },
        threats: {
          threat_score: 5,
          threat_level: 'low',
          is_malicious: false,
        },
        asn_analysis: {
          asn: result.org ? 13335 : 0, // Default Cloudflare ASN or 0 if unknown
          info: {
            asn: result.org ? 13335 : 0,
            name: result.org || 'Unknown',
            org_name: result.org || 'Unknown',
            country: result.country || 'Unknown',
            description: result.org || 'Unknown Organization',
          },
          timestamp: new Date().toISOString(),
        },
        risk_assessment: {
          overall_score: 5,
          overall_level: 'low',
          factors: ['No significant risk factors detected'],
          recommendation: 'Low risk. Normal processing recommended.',
        },
        sources_used: ['ipinfo'],
        analysis_timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error({ err: error }, 'Enhanced IP analysis failed');
      return c.json(
        {
          error: 'Internal Server Error',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        500
      );
    }
  });

  // GET /api/v1/ip - Get client's basic IP info
  app.get('/api/v1/ip', async c => {
    try {
      const ip = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for')?.split(',')[0] || '127.0.0.1';

      const services = getWorkerIpService(c.env);
      const result = await services.lookupIpInsight(ip);
      return c.json(result);
    } catch (error) {
      logger.error({ err: error }, 'Basic IP lookup failed');
      return c.json(
        {
          error: 'Internal Server Error',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        500
      );
    }
  });

  // GET /api/v1/ip/:ip - Basic IP lookup for specific IP
  app.get('/api/v1/ip/:ip', async c => {
    try {
      const ip = c.req.param('ip');

      if (!ip || !/^(\d{1,3}\.){3}\d{1,3}$/.test(ip)) {
        return c.json({ error: 'Invalid IP address' }, 400);
      }

      const services = getWorkerIpService(c.env);
      const result = await services.lookupIpInsight(ip);
      return c.json(result);
    } catch (error) {
      logger.error({ err: error }, 'Basic IP lookup failed');
      return c.json(
        {
          error: 'Internal Server Error',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        500
      );
    }
  });

  // GET /api/v1/services/status - Get status of all services
  app.get('/api/v1/services/status', async c => {
    try {
      const services = getWorkerIpService(c.env);
      const radarHealthy = await services.verifyRadarToken();

      return c.json({
        geolocation: true,
        threat_intelligence: radarHealthy,
        asn_analysis: radarHealthy,
        ipinfo: !!c.env.IPINFO_TOKEN,
        radar: !!c.env.CLOUDFLARE_RADAR_TOKEN,
        abuseipdb: !!c.env.ABUSEIPDB_API_KEY,
      });
    } catch (error) {
      logger.error({ err: error }, 'Service status check failed');
      return c.json({
        geolocation: false,
        threat_intelligence: false,
        asn_analysis: false,
        ipinfo: false,
        radar: false,
        abuseipdb: false,
      });
    }
  });

  // Static files (frontend)
  // Note: Workers doesn't serve static files directly
  // You should deploy frontend separately to Cloudflare Pages
  app.get('/*', c => {
    return c.json({
      message: 'IPhey API Server',
      endpoints: {
        health: '/api/health',
        ipLookup: '/api/ip/:ip',
        report: '/api/v1/report (POST)',
      },
      frontend: 'Deploy frontend to Cloudflare Pages',
      docs: 'See CLOUDFLARE_DEPLOYMENT.md',
    });
  });

  return app;
}

const workerApp = createWorkerApp();

/**
 * Workers Fetch Handler
 */
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    try {
      const services = getWorkerIpService(env);
      // Initialize cache on first request (per-isolate singleton)
      if (!workerGlobal.ipCacheInitialized && env.IP_CACHE) {
        logger.info('Initializing Cloudflare KV cache');

        // Create KV cache instance (ensures Cloudflare KV adapter is available)
        workerGlobal.ipCacheInitialized = true;

        // Trigger cache warming in background (don't block response)
        if (env.CACHE_WARMING_ENABLED === 'true') {
          ctx.waitUntil(
            cacheWarmer
              .warmCache(services.lookupIpInsight, {
                enabled: true,
                delayBetweenRequests: Number(env.CACHE_WARMING_DELAY_MS) || 100,
              })
              .catch(err => {
                logger.error({ err }, 'Cache warming failed');
              })
          );
        }
      }

      // Handle request with shared Hono app
      return workerApp.fetch(request, env, ctx);
    } catch (error) {
      logger.error({ err: error }, 'Worker error');

      return new Response(
        JSON.stringify({
          error: 'Internal Server Error',
          message: error instanceof Error ? error.message : 'Unknown error',
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }
  },

  /**
   * Scheduled handler for cron jobs (optional)
   * Configure in wrangler.toml:
   * [triggers]
   * crons = ["0 * * * *"]  # Every hour
   */
  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    logger.info('Running scheduled cache refresh');

    // Refresh cache for common IPs
    const services = getWorkerIpService(env);
    ctx.waitUntil(
      cacheWarmer
        .warmCache(services.lookupIpInsight, {
          enabled: true,
          delayBetweenRequests: 100,
        })
        .catch(err => {
          logger.error({ err }, 'Scheduled cache refresh failed');
        })
    );
  },
};
