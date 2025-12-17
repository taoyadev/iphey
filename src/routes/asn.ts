/**
 * ASN Analysis Routes
 * API endpoints for Autonomous System Number analysis
 */

import { Router } from 'express';
import { ASNService, extractASN } from '../services/asnService';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

export const asnRouter = Router();
const asnService = new ASNService();

/**
 * GET /v1/asn/:asn
 * Get comprehensive ASN analysis
 *
 * Example: GET /v1/asn/15169
 * Example: GET /v1/asn/AS15169
 *
 * Response:
 * {
 *   "asn": 15169,
 *   "info": {
 *     "asn": 15169,
 *     "name": "GOOGLE",
 *     "org_name": "Google LLC",
 *     "description": "Google LLC",
 *     "country": "US"
 *   },
 *   "prefixes": [
 *     {
 *       "prefix": "8.8.8.0/24",
 *       "ip_version": 4,
 *       "status": "active"
 *     }
 *   ],
 *   "last_updated": "2025-11-16T..."
 * }
 */
asnRouter.get(
  '/v1/asn/:asn',
  asyncHandler(async (req, res) => {
    const asnParam = req.params.asn;

    // Extract ASN number from parameter (supports "AS15169", "15169", etc.)
    const asn = extractASN(asnParam);

    if (!asn) {
      throw new ApiError(400, `Invalid ASN format: ${asnParam}`);
    }

    logger.info({ asn, originalParam: asnParam }, 'ASN analysis request');

    // Perform ASN analysis
    const result = await asnService.analyzeASN(asn);

    res.json(result);
  })
);

/**
 * GET /v1/asn/status
 * Get ASN analysis service status
 *
 * Example: GET /v1/asn/status
 *
 * Response:
 * {
 *   "configured": true,
 *   "available": true,
 *   "provider": "Cloudflare Radar"
 * }
 */
asnRouter.get(
  '/v1/asn-status',
  asyncHandler(async (req, res) => {
    logger.debug('ASN service status request');

    const status = await asnService.getStatus();

    res.json(status);
  })
);

logger.info({ routes: ['/v1/asn/:asn', '/v1/asn-status'] }, 'ASN analysis routes registered');
