import type { ReportRequestBody, ReportResponse } from '../../types/report';
import { reportRequestSchema } from '../../schemas/report';
import { ApiError } from '../../utils/apiError';
import { evaluateBrowser } from './browserEvaluator';
import { evaluateLocation } from './locationEvaluator';
import { evaluateIp } from './ipEvaluator';
import { evaluateHardware } from './hardwareEvaluator';
import { evaluateSoftware } from './softwareEvaluator';
import { statusFromScore } from './scoring';
import type { NormalizedIpInsight } from '../../types/ip';

/**
 * Weight configuration for multi-panel scoring
 */
const WEIGHTS = {
  browser: 0.3,
  ipAddress: 0.3,
  location: 0.133,
  hardware: 0.133,
  software: 0.133,
};

/**
 * Generate comprehensive fingerprint report
 * Combines browser, location, IP, hardware, and software evaluations
 */
export const generateReportWithLookup = async (
  payload: ReportRequestBody,
  clientIp?: string,
  ipLookup?: (ip: string) => Promise<NormalizedIpInsight>
): Promise<ReportResponse> => {
  const parsed = reportRequestSchema.safeParse(payload);
  if (!parsed.success) {
    throw new ApiError(400, 'Invalid request body', parsed.error.flatten());
  }

  const data = parsed.data;
  const fingerprint = data.fingerprint;
  const hasCanvas = Boolean(fingerprint.canvas?.hash || fingerprint.canvasFingerprint);
  const hasWebGL = Boolean(fingerprint.webgl?.renderer || fingerprint.webglRenderer);
  const hasAudio = Boolean(fingerprint.audio?.hash || fingerprint.audioFingerprint);
  if (!hasCanvas || !hasWebGL || !hasAudio) {
    throw new ApiError(
      422,
      'Legacy scoring requires complete hardware measurements; use the observation workspace for partial results'
    );
  }
  const ipToInspect = data.ip ?? clientIp;
  if (!ipToInspect) {
    throw new ApiError(400, 'IP is required if not provided via request');
  }

  if (!ipLookup) {
    throw new Error('IP lookup function is required in this environment');
  }

  const insight = await ipLookup(ipToInspect);
  if (insight.riskScore === undefined)
    throw new ApiError(503, 'Legacy risk report unavailable; use /api/v2/connection for partial observations');

  // Parallelize evaluators for better performance
  const [browser, location, ipAddress, hardware, software] = await Promise.all([
    Promise.resolve(evaluateBrowser(data.fingerprint)),
    Promise.resolve(evaluateLocation(data.fingerprint, insight.timezone)),
    Promise.resolve(evaluateIp(insight.riskScore, insight.privacy, insight.networkType, insight.org, insight.asn)),
    Promise.resolve(evaluateHardware(data.fingerprint)),
    Promise.resolve(evaluateSoftware(data.fingerprint)),
  ]);

  const panels = {
    browser,
    location,
    ipAddress,
    hardware,
    software,
  };

  const score =
    panels.browser.score * WEIGHTS.browser +
    panels.ipAddress.score * WEIGHTS.ipAddress +
    panels.location.score * WEIGHTS.location +
    panels.hardware.score * WEIGHTS.hardware +
    panels.software.score * WEIGHTS.software;

  // Enhanced response with detailed information
  return {
    verdict: statusFromScore(score),
    score: Math.round(score),
    panels: {
      browser: {
        status: panels.browser.status,
        score: panels.browser.score,
        signals: panels.browser.signals,
      },
      location: {
        status: panels.location.status,
        score: panels.location.score,
        signals: panels.location.signals,
      },
      ipAddress: {
        status: panels.ipAddress.status,
        score: panels.ipAddress.score,
        signals: panels.ipAddress.signals,
      },
      hardware: {
        status: panels.hardware.status,
        score: panels.hardware.score,
        signals: panels.hardware.signals,
      },
      software: {
        status: panels.software.status,
        score: panels.software.score,
        signals: panels.software.signals,
      },
    },
    ip: insight.ip,
    fetchedAt: Date.now(),
    source: insight.source,
  };
};
