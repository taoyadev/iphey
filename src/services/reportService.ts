/**
 * Report Service Facade
 *
 * Worker-only facade over the shared report generator. Runtime callers supply
 * an IP lookup function so this module stays free of provider/runtime imports.
 */

import type { ReportRequestBody, ReportResponse } from '../types/report';
import type { NormalizedIpInsight } from '../types/ip';
import { generateReportWithLookup } from './report';

type IpLookupFn = (ip: string) => Promise<NormalizedIpInsight>;

export async function generateReport(
  payload: ReportRequestBody,
  clientIp?: string,
  ipLookup?: IpLookupFn
): Promise<ReportResponse> {
  if (!ipLookup) {
    throw new Error('IP lookup function is required in this environment');
  }

  return generateReportWithLookup(payload, clientIp, ipLookup);
}

export { generateReportWithLookup } from './report';
export type { DetailedSignal, EnhancedPanelResult } from './report/scoring';
