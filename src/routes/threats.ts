/**
 * Threat Intelligence Routes
 * API endpoints for IP threat analysis
 */

import { Router } from 'express';
import { ThreatIntelligenceService } from '../services/threatIntelligence';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { config } from '../config';

export const threatsRouter = Router();
const threatService = new ThreatIntelligenceService();

/**
 * GET /v1/ip/:ip/threats
 * Analyze IP address for threats using multiple intelligence sources
 *
 * Example: GET /v1/ip/8.8.8.8/threats
 *
 * Response:
 * {
 *   "providers": {
 *     "abuseipdb": { ... },
 *     "spamhaus": { ... }
 *   },
 *   "combined": {
 *     "is_malicious": false,
 *     "threat_score": 5,
 *     "threat_level": "low",
 *     "threat_types": [],
 *     "sources": ["AbuseIPDB", "Spamhaus"],
 *     "confidence": 0.95
 *   },
 *   "timestamp": "2025-11-16T..."
 * }
 */
threatsRouter.get(
  '/v1/ip/:ip/threats',
  asyncHandler(async (req, res) => {
    // Check if threat intelligence is enabled
    if (!config.ENABLE_THREAT_INTEL) {
      throw new ApiError(503, 'Threat intelligence is not enabled');
    }

    const { ip } = req.params;

    // Basic IP validation
    if (!ip || ip.length < 7 || ip.length > 45) {
      throw new ApiError(400, 'Invalid IP address format');
    }

    logger.info({ ip }, 'Threat intelligence request');

    // Analyze IP for threats
    const result = await threatService.analyzeIP(ip);

    res.json(result);
  })
);

/**
 * GET /v1/threats/status
 * Get status of threat intelligence providers
 *
 * Example: GET /v1/threats/status
 *
 * Response:
 * {
 *   "enabled": true,
 *   "providers": {
 *     "abuseipdb": {
 *       "configured": true,
 *       "available": true
 *     },
 *     "spamhaus": {
 *       "configured": true,
 *       "available": true
 *     }
 *   },
 *   "available_sources": 2,
 *   "total_sources": 2,
 *   "rate_limits": {
 *     "abuseipdb": {
 *       "requests_per_day": 1000,
 *       "requests_per_hour": 42
 *     },
 *     "spamhaus": {
 *       "requests_per_day": 10000,
 *       "requests_per_hour": 417
 *     }
 *   }
 * }
 */
threatsRouter.get(
  '/v1/threats/status',
  asyncHandler(async (req, res) => {
    logger.debug('Threat intelligence status request');

    const status = await threatService.getProviderStatus();
    const rateLimits = threatService.getRateLimits();

    res.json({
      enabled: config.ENABLE_THREAT_INTEL,
      providers: status,
      available_sources: status.available_sources,
      total_sources: status.total_sources,
      rate_limits: rateLimits,
    });
  })
);

logger.info(
  {
    enabled: config.ENABLE_THREAT_INTEL,
    routes: ['/v1/ip/:ip/threats', '/v1/threats/status'],
  },
  'Threat intelligence routes registered'
);
