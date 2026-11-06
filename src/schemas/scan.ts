import { z } from 'zod';
import { ipInsightSchema } from './ipInsight';
import { fingerprintSchema } from './report';
import { parseIP } from '../utils/networkInput';
const metadata = {
  status: z.enum(['observed', 'not-run', 'unsupported', 'blocked', 'timeout', 'no-result', 'unavailable', 'error']),
  source: z.string().max(512),
  observedAt: z.number().finite(),
  limitation: z.string().max(4000),
  requestId: z.string().max(80).optional(),
  retrievedAt: z.number().finite().optional(),
  sourceObservedAt: z.number().finite().nullable().optional(),
};
export const connectionResponseSchema = z.object({
  schemaVersion: z.literal(2),
  requestId: z.string().max(80),
  ip: z.object({
    ...metadata,
    status: z.literal('observed'),
    value: z.string().refine(value => parseIP(value) !== null),
  }),
  enrichment: z
    .object({
      ...metadata,
      value: ipInsightSchema
        .extend({ cacheStatus: z.enum(['fresh', 'stale']).optional(), refreshFailed: z.boolean().optional() })
        .nullable(),
    })
    .refine(value => value.status !== 'observed' || value.value !== null),
});

const timestamp = z.number().finite().nonnegative().max(8640000000000000);
export const savedScanSchema = z
  .object({
    schemaVersion: z.literal(2),
    collectorVersion: z.string().min(1).max(80),
    rulesVersion: z.string().min(1).max(80),
    scanId: z.string().min(1).max(80),
    name: z.string().max(80),
    subject: z.literal('current-environment'),
    scope: z.array(z.string().min(1).max(64)).max(32),
    startedAt: timestamp,
    completedAt: timestamp.positive(),
    fingerprint: fingerprintSchema,
    observations: z.record(
      z.string().min(1).max(64),
      z.object({ ...metadata, observedAt: timestamp, value: z.unknown() }).refine(item => 'value' in item)
    ),
  })
  .refine(record => record.completedAt >= record.startedAt && Object.keys(record.observations).length <= 32);
export const savedScansSchema = z.array(savedScanSchema).max(50);
export const legacyRecordsSchema = z.array(z.object({ id: z.string().min(1).max(256), timestamp }).passthrough());
