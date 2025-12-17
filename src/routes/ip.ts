import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { lookupIpInsight } from '../services/ipService';
import { EnhancedIpService } from '../services/enhancedIpService';
import { ApiError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

export const ipRouter = Router();

// Initialize enhanced IP service
const enhancedIpService = new EnhancedIpService();

/**
 * GET /v1/ip/enhanced
 * Get current client IP with enhanced analysis
 *
 * Example: GET /v1/ip/enhanced
 */
ipRouter.get(
  '/v1/ip/enhanced',
  asyncHandler(async (req, res) => {
    const ip = req.ip;
    if (!ip) {
      throw new ApiError(400, 'Unable to determine client IP');
    }

    const includeThreat = req.query.threats !== 'false';
    const includeASN = req.query.asn !== 'false';

    logger.info({ ip, includeThreat, includeASN }, 'Enhanced IP analysis request (client IP)');

    const result = await enhancedIpService.detectIP(ip, {
      includeThreat,
      includeASN,
    });

    res.json(result);
  })
);

/**
 * GET /v1/ip
 * Get current client IP information (basic)
 *
 * Example: GET /v1/ip
 */
ipRouter.get(
  '/v1/ip',
  asyncHandler(async (req, res) => {
    const ip = req.ip;
    if (!ip) {
      throw new ApiError(400, 'Unable to determine client IP');
    }
    const insight = await lookupIpInsight(ip);
    res.json(insight);
  })
);

/**
 * GET /v1/ip/:ip/enhanced
 * Enhanced IP analysis with threat intelligence and ASN data
 *
 * Example: GET /v1/ip/8.8.8.8/enhanced
 * Example: GET /v1/ip/8.8.8.8/enhanced?threats=true&asn=true
 *
 * Query Parameters:
 * - threats: Include threat intelligence (default: true)
 * - asn: Include ASN analysis (default: true)
 *
 * Response:
 * {
 *   "ip": "8.8.8.8",
 *   "geolocation": { ... },
 *   "threats": { ... },
 *   "asn_analysis": { ... },
 *   "risk_assessment": {
 *     "overall_score": 5,
 *     "overall_level": "low",
 *     "factors": ["No significant risk factors detected"],
 *     "recommendation": "Low risk. Normal processing recommended."
 *   },
 *   "sources_used": ["ipinfo", "Spamhaus", "Cloudflare Radar ASN"],
 *   "analysis_timestamp": "2025-11-16T..."
 * }
 */
ipRouter.get(
  '/v1/ip/:ip/enhanced',
  asyncHandler(async (req, res) => {
    const ip = req.params.ip;
    if (!ip) {
      throw new ApiError(400, 'IP parameter missing');
    }

    // Parse query parameters
    const includeThreat = req.query.threats !== 'false'; // Default: true
    const includeASN = req.query.asn !== 'false'; // Default: true

    logger.info({ ip, includeThreat, includeASN }, 'Enhanced IP analysis request');

    const result = await enhancedIpService.detectIP(ip, {
      includeThreat,
      includeASN,
    });

    res.json(result);
  })
);

/**
 * GET /v1/ip/:ip
 * Basic IP lookup (legacy endpoint - for backward compatibility)
 *
 * Example: GET /v1/ip/8.8.8.8
 */
ipRouter.get(
  '/v1/ip/:ip',
  asyncHandler(async (req, res) => {
    const ip = req.params.ip;
    if (!ip) {
      throw new ApiError(400, 'IP parameter missing');
    }
    const insight = await lookupIpInsight(ip);
    res.json(insight);
  })
);

/**
 * GET /v1/services/status
 * Get status of all IP intelligence services
 *
 * Example: GET /v1/services/status
 *
 * Response:
 * {
 *   "geolocation": true,
 *   "threat_intelligence": true,
 *   "asn_analysis": false
 * }
 */
ipRouter.get(
  '/v1/services/status',
  asyncHandler(async (req, res) => {
    logger.debug('Service status request');

    const status = await enhancedIpService.getServiceStatus();

    res.json(status);
  })
);

logger.info(
  {
    routes: ['/v1/ip/:ip', '/v1/ip/:ip/enhanced', '/v1/ip', '/v1/ip/enhanced', '/v1/services/status'],
  },
  'IP routes registered'
);
