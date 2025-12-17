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

// AI Chat helper functions
function buildAIChatSystemPrompt(context?: {
  overallScore?: number;
  verdict?: string;
  panels?: Record<string, { score: number; status: string; signals?: string[] }>;
  ip?: { address?: string; city?: string; country?: string; timezone?: string; isp?: string; asn?: string };
  threats?: { level: string; score: number; factors: string[] };
}): string {
  let systemPrompt = `You are IPH, an AI assistant for IPhey - a browser fingerprint analysis tool.

Your role:
- Explain browser fingerprinting concepts clearly
- Help users understand their trust scores
- Provide actionable privacy recommendations
- Answer questions about IP reputation, geolocation, and digital identity

Guidelines:
- Be concise and helpful (2-3 paragraphs max)
- Use simple language, avoid jargon
- Provide specific, actionable recommendations
- Use emojis sparingly for friendliness
- If asked about something not in the context, be honest about limitations`;

  if (context) {
    systemPrompt += '\n\n--- User Context ---\n';

    if (context.overallScore !== undefined && context.verdict) {
      systemPrompt += `Overall Trust Score: ${context.overallScore}/100 (${context.verdict})\n`;
    }

    if (context.panels) {
      systemPrompt += '\nPanel Scores:\n';
      for (const [key, panel] of Object.entries(context.panels)) {
        systemPrompt += `- ${key}: ${panel.score}/100 (${panel.status})`;
        if (panel.signals?.length) {
          systemPrompt += ` - Signals: ${panel.signals.slice(0, 3).join(', ')}`;
        }
        systemPrompt += '\n';
      }
    }

    if (context.ip) {
      systemPrompt += '\nIP Information:\n';
      if (context.ip.address) systemPrompt += `- IP: ${context.ip.address}\n`;
      if (context.ip.city && context.ip.country) {
        systemPrompt += `- Location: ${context.ip.city}, ${context.ip.country}\n`;
      }
      if (context.ip.timezone) systemPrompt += `- Timezone: ${context.ip.timezone}\n`;
      if (context.ip.isp) systemPrompt += `- ISP: ${context.ip.isp}\n`;
      if (context.ip.asn) systemPrompt += `- ASN: ${context.ip.asn}\n`;
    }

    if (context.threats) {
      systemPrompt += `\nThreat Assessment: ${context.threats.level} (score: ${context.threats.score})\n`;
      if (context.threats.factors.length > 0) {
        systemPrompt += `Risk Factors: ${context.threats.factors.join(', ')}\n`;
      }
    }

    systemPrompt += '\n--- End Context ---\n';
    systemPrompt += '\nReference this data when answering user questions about their fingerprint.';
  }

  return systemPrompt;
}

function getFallbackResponse(prompt: string): string {
  const lowerPrompt = prompt.toLowerCase();

  if (lowerPrompt.includes('fingerprint') || lowerPrompt.includes('what is')) {
    return "Browser fingerprinting is a technique websites use to identify and track users by collecting information about their browser, device, and settings. This creates a unique 'fingerprint' that can identify you even without cookies. IPhey helps you understand what information is being collected and how unique your fingerprint is.";
  }

  if (lowerPrompt.includes('privacy') || lowerPrompt.includes('improve')) {
    return 'To improve your privacy: 1) Use a privacy-focused browser like Firefox or Brave, 2) Enable anti-fingerprinting features, 3) Use a reputable VPN, 4) Keep your browser updated, 5) Consider using browser extensions like Privacy Badger. Check your panel scores to see which areas need the most attention.';
  }

  if (lowerPrompt.includes('vpn') || lowerPrompt.includes('proxy')) {
    return "To check if your VPN/proxy is working effectively, look at your IP Address panel score and location data. If they show your VPN's exit location instead of your real location, it's working. However, browser fingerprinting can still identify you even with a VPN - that's why checking all panels is important.";
  }

  if (lowerPrompt.includes('score') || lowerPrompt.includes('trust')) {
    return 'Your trust score reflects how consistent your digital identity appears. A low score may indicate: timezone mismatches, unusual browser settings, detected automation, or inconsistencies between your IP location and browser settings. Check individual panel details to see specific issues.';
  }

  return "I'm IPH, your fingerprint analysis assistant. I can help you understand your browser fingerprint, explain trust scores, and provide privacy recommendations. Unfortunately, I'm currently unable to connect to my AI service. Please try again later, or explore the detailed panel information in IPhey for insights.";
}

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
          postal: '00000',
        };
      }

      // Parse ASN number from string like "AS13335" or just return the raw value
      const parseAsnNumber = (asn: string | undefined): number => {
        if (!asn) return 0;
        const match = asn.match(/AS?(\d+)/i);
        return match ? parseInt(match[1], 10) : 0;
      };

      const asnNumber = parseAsnNumber(result.asn);
      const asnString = result.asn || 'Unknown';

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
          asn: asnString,
          source: result.source || 'ipinfo',
          fetchedAt: result.fetchedAt || Date.now(),
          anycast: result.anycast || false,
          bogon: result.bogon || false,
        },
        threats: {
          threat_score: result.riskScore || 5,
          threat_level: (result.riskScore || 0) > 50 ? 'high' : (result.riskScore || 0) > 25 ? 'medium' : 'low',
          is_malicious: (result.riskScore || 0) > 70,
          factors: result.riskReasons || [],
        },
        asn_analysis: {
          asn: asnNumber,
          info: {
            asn: asnNumber,
            name: result.org || 'Unknown',
            org_name: result.org || 'Unknown',
            country: result.country || 'Unknown',
            description: result.org || 'Unknown Organization',
            network_type: result.networkType || 'Unknown',
          },
          timestamp: new Date().toISOString(),
        },
        risk_assessment: {
          overall_score: result.riskScore || 5,
          overall_level: (result.riskScore || 0) > 50 ? 'high' : (result.riskScore || 0) > 25 ? 'medium' : 'low',
          factors: result.riskReasons || ['No significant risk factors detected'],
          recommendation: (result.riskScore || 0) > 50 ? 'High risk. Additional verification recommended.' : 'Low risk. Normal processing recommended.',
        },
        privacy: result.privacy || null,
        sources_used: [result.source || 'ipinfo'],
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
          postal: '00000',
        };
      }

      // Parse ASN number from string like "AS13335" or just return the raw value
      const parseAsnNumber = (asn: string | undefined): number => {
        if (!asn) return 0;
        const match = asn.match(/AS?(\d+)/i);
        return match ? parseInt(match[1], 10) : 0;
      };

      const asnNumber = parseAsnNumber(result.asn);
      const asnString = result.asn || 'Unknown';

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
          asn: asnString,
          source: result.source || 'ipinfo',
          fetchedAt: result.fetchedAt || Date.now(),
          anycast: result.anycast || false,
          bogon: result.bogon || false,
        },
        threats: {
          threat_score: result.riskScore || 5,
          threat_level: (result.riskScore || 0) > 50 ? 'high' : (result.riskScore || 0) > 25 ? 'medium' : 'low',
          is_malicious: (result.riskScore || 0) > 70,
          factors: result.riskReasons || [],
        },
        asn_analysis: {
          asn: asnNumber,
          info: {
            asn: asnNumber,
            name: result.org || 'Unknown',
            org_name: result.org || 'Unknown',
            country: result.country || 'Unknown',
            description: result.org || 'Unknown Organization',
            network_type: result.networkType || 'Unknown',
          },
          timestamp: new Date().toISOString(),
        },
        risk_assessment: {
          overall_score: result.riskScore || 5,
          overall_level: (result.riskScore || 0) > 50 ? 'high' : (result.riskScore || 0) > 25 ? 'medium' : 'low',
          factors: result.riskReasons || ['No significant risk factors detected'],
          recommendation: (result.riskScore || 0) > 50 ? 'High risk. Additional verification recommended.' : 'Low risk. Normal processing recommended.',
        },
        privacy: result.privacy || null,
        sources_used: [result.source || 'ipinfo'],
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

  // POST /api/ai/chat - AI chat endpoint for fingerprint analysis
  app.post('/api/ai/chat', async c => {
    try {
      const body = await c.req.json<{
        prompt: string;
        context?: {
          overallScore?: number;
          verdict?: string;
          panels?: Record<string, { score: number; status: string; signals?: string[] }>;
          ip?: { address?: string; city?: string; country?: string; timezone?: string; isp?: string; asn?: string };
          threats?: { level: string; score: number; factors: string[] };
        };
        messages?: Array<{ role: string; content: string }>;
      }>();

      if (!body?.prompt || body.prompt.length > 2000) {
        return c.json({ error: 'Invalid prompt' }, 400);
      }

      const apiKey = c.env.OPENROUTER_API_KEY;

      // Fallback response when API key is not configured
      if (!apiKey) {
        const fallbackResponse = getFallbackResponse(body.prompt);
        return c.json({ content: fallbackResponse, fallback: true });
      }

      // Build system prompt
      const systemPrompt = buildAIChatSystemPrompt(body.context);
      const messages = [
        { role: 'system', content: systemPrompt },
        ...(body.messages?.slice(-10) || []),
        { role: 'user', content: body.prompt },
      ];

      // Model priority list (tested 2025-12-04)
      const models = [
        'google/gemini-2.0-flash-exp:free', // 1M context, fastest
        'meta-llama/llama-3.3-70b-instruct:free', // 70B, high quality
        'qwen/qwen3-235b-a22b:free', // 235B params
        'mistralai/mistral-small-3.1-24b-instruct:free', // fast
      ];

      // Try models in order
      for (const model of models) {
        try {
          const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${apiKey}`,
              'HTTP-Referer': 'https://iphey.org',
              'X-Title': 'IPhey AI Assistant',
            },
            body: JSON.stringify({
              model,
              messages,
              stream: true,
              max_tokens: 512,
              temperature: 0.7,
            }),
          });

          if (response.ok) {
            return new Response(response.body, {
              headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                Connection: 'keep-alive',
                'Access-Control-Allow-Origin': '*',
              },
            });
          }
          // Model failed, try next
          logger.warn({ model, status: response.status }, 'Model unavailable, trying next');
        } catch (err) {
          logger.warn({ model, err }, 'Model request failed, trying next');
        }
      }

      // All models failed, return fallback
      return c.json({ content: getFallbackResponse(body.prompt), fallback: true });
    } catch (error) {
      logger.error({ err: error }, 'AI chat failed');
      return c.json({ content: getFallbackResponse(''), fallback: true, error: 'Internal error' }, 500);
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
