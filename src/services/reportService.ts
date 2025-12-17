/**
 * Report Service Facade
 *
 * Keeps the Node.js Express server and the Cloudflare Worker entry point
 * aligned by sharing the same generator implementation. The Worker supplies
 * its own IP lookup function, while the Node process lazily imports the
 * Node-specific lookup to avoid bundling it into the worker build.
 */

import type { ReportRequestBody, ReportResponse } from '../types/report';
import type { NormalizedIpInsight } from '../types/ip';
import { generateReportWithLookup } from './report';

type IpLookupFn = (ip: string) => Promise<NormalizedIpInsight>;

let defaultLookup: IpLookupFn | null = null;
let defaultLookupPromise: Promise<IpLookupFn | null> | null = null;

const loadDefaultLookup = async (): Promise<IpLookupFn | null> => {
  if (defaultLookup) {
    return defaultLookup;
  }

  if (defaultLookupPromise) {
    return defaultLookupPromise;
  }

  if (typeof process === 'undefined' || process.release?.name !== 'node') {
    return null;
  }

  const isTsRuntime = Boolean(
    process.env.TS_NODE_DEV ||
      process.env.TS_NODE_PROJECT ||
      process.env.TS_NODE_BASEURL ||
      process.env.TS_NODE_TRANSPILE_ONLY ||
      process.env.VITEST
  );

  const modulePath = isTsRuntime ? './ipService.ts' : './ipService.js';

  defaultLookupPromise = import(modulePath)
    .then(module => {
      defaultLookup = (module as { lookupIpInsight: IpLookupFn }).lookupIpInsight;
      return defaultLookup;
    })
    .catch(error => {
      defaultLookupPromise = null;
      throw error;
    });

  return defaultLookupPromise;
};

export async function generateReport(
  payload: ReportRequestBody,
  clientIp?: string,
  ipLookup?: IpLookupFn
): Promise<ReportResponse> {
  const lookup = ipLookup ?? (await loadDefaultLookup());
  if (!lookup) {
    throw new Error('IP lookup function is required in this environment');
  }

  return generateReportWithLookup(payload, clientIp, lookup);
}

export { generateReportWithLookup } from './report';
export type { DetailedSignal, EnhancedPanelResult } from './report/scoring';
