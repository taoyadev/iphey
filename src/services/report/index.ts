import type { ReportRequestBody, ReportResponse } from '../../types/report';
import { reportRequestSchema } from '../../schemas/report';
import { ApiError } from '../../middleware/errorHandler';
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
  const ipToInspect = data.ip ?? clientIp;
  if (!ipToInspect) {
    throw new ApiError(400, 'IP is required if not provided via request');
  }

  if (!ipLookup) {
    throw new Error('IP lookup function is required in this environment');
  }

  const insight = await ipLookup(ipToInspect);

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
    // Enhanced data for frontend
    enhanced: {
      browser: {
        detailedSignals: panels.browser.detailedSignals,
        confidence: panels.browser.confidence,
        entropy: panels.browser.entropy,
        breakdown: panels.browser.breakdown,
      },
      location: {
        detailedSignals: panels.location.detailedSignals,
        confidence: panels.location.confidence,
        entropy: panels.location.entropy,
        breakdown: panels.location.breakdown,
      },
      ipAddress: {
        detailedSignals: panels.ipAddress.detailedSignals,
        confidence: panels.ipAddress.confidence,
        entropy: panels.ipAddress.entropy,
        breakdown: panels.ipAddress.breakdown,
      },
      hardware: {
        detailedSignals: panels.hardware.detailedSignals,
        confidence: panels.hardware.confidence,
        entropy: panels.hardware.entropy,
        breakdown: panels.hardware.breakdown,
      },
      software: {
        detailedSignals: panels.software.detailedSignals,
        confidence: panels.software.confidence,
        entropy: panels.software.entropy,
        breakdown: panels.software.breakdown,
      },
    },
  };
};
