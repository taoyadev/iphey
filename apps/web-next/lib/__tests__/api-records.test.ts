import { afterEach, it, expect, vi } from 'vitest';
import { fetchWithApiFallback } from '../api';
import {
  readRecords,
  readLegacyRecords,
  clearRecords,
  saveRecord,
  deleteRecord,
  RECORD_KEY,
  MAX_RECORD_CHARS,
} from '../records';
import type { ScanRecord } from '../../../../src/types/scan';
const completed = (id = 'scan-1'): ScanRecord => ({
  schemaVersion: 2,
  collectorVersion: '2.0.0',
  rulesVersion: 'observations-1',
  scanId: id,
  name: 'Baseline',
  subject: 'current-environment',
  scope: ['browser'],
  startedAt: 1,
  completedAt: 2,
  fingerprint: { userAgent: 'Example browser' },
  observations: {
    browser: { status: 'observed', value: {}, source: 'This browser', observedAt: 1, limitation: 'Test scope' },
  },
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
it('retains same-origin development requests and never retries cancellation', async () => {
  vi.stubEnv('NODE_ENV', 'development');
  vi.stubEnv('NEXT_PUBLIC_API_URL', '');
  const fetchMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => new Response('{}'));
  vi.stubGlobal('fetch', fetchMock);
  await fetchWithApiFallback('/api/health');
  expect(fetchMock.mock.calls[0][0]).toBe('/api/health');
  const controller = new AbortController();
  controller.abort();
  await expect(fetchWithApiFallback('/api/health', { signal: controller.signal })).rejects.toThrow();
  expect(fetchMock).toHaveBeenCalledTimes(1);
});
it('preserves invalid existing records instead of overwriting them', () => {
  const setItem = vi.fn();
  vi.stubGlobal('localStorage', { getItem: () => '{bad', setItem });
  expect(() => readRecords()).toThrow();
  expect(() => saveRecord({ completedAt: 1 } as ScanRecord)).toThrow();
  expect(setItem).not.toHaveBeenCalled();
});
it('propagates quota failure and clears all associated history keys', () => {
  const removeItem = vi.fn();
  vi.stubGlobal('localStorage', {
    getItem: () => null,
    setItem: () => {
      throw new Error('Quota');
    },
    removeItem,
  });
  expect(() => saveRecord(completed())).toThrow('Quota');
  clearRecords();
  expect(removeItem.mock.calls.map(call => call[0])).toEqual([
    RECORD_KEY,
    'iphey-history',
    'iphey-last-history-save',
    'iphey-last-remediation',
  ]);
});

it('rejects invalid new records before claiming persistence', () => {
  const setItem = vi.fn();
  vi.stubGlobal('localStorage', { getItem: () => null, setItem });
  expect(() => saveRecord({ ...completed(), completedAt: Infinity })).toThrow();
  expect(() => saveRecord({ ...completed(), subject: 'wrong' as ScanRecord['subject'] })).toThrow();
  expect(setItem).not.toHaveBeenCalled();
});
it('refuses a write that the next read would reject for size', () => {
  const record = completed();
  record.observations.browser.value = 'x'.repeat(MAX_RECORD_CHARS);
  const setItem = vi.fn();
  vi.stubGlobal('localStorage', { getItem: () => null, setItem });
  expect(() => saveRecord(record)).toThrow('exceed');
  expect(setItem).not.toHaveBeenCalled();
});
it('deleting a selected record preserves records saved after the page snapshot', () => {
  let saved = JSON.stringify([completed('older'), completed('newer')]);
  vi.stubGlobal('localStorage', {
    getItem: () => saved,
    setItem: (_key: string, value: string) => {
      saved = value;
    },
  });
  deleteRecord('older');
  expect(readRecords().map(record => record.scanId)).toEqual(['newer']);
});
it('reads legacy records without changing them and isolates malformed legacy data', () => {
  const setItem = vi.fn();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) =>
      key === RECORD_KEY
        ? JSON.stringify([completed()])
        : JSON.stringify([{ id: 'legacy', timestamp: 1, score: 90, metadata: { ip: '192.0.2.1' } }]),
    setItem,
  });
  expect(readLegacyRecords()[0]).toMatchObject({ id: 'legacy', metadata: { ip: '192.0.2.1' } });
  expect(setItem).not.toHaveBeenCalled();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => (key === RECORD_KEY ? JSON.stringify([completed()]) : '{bad'),
    setItem,
  });
  expect(() => readLegacyRecords()).toThrow();
  expect(readRecords()).toHaveLength(1);
  expect(setItem).not.toHaveBeenCalled();
});
