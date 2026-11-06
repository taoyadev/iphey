import { describe, it, expect, vi } from 'vitest';
import { parseIP, parseASN } from '../networkInput';
import { RequestDeduplicator } from '../requestDeduplication';
import { compareScans } from '../compareScans';
import type { ScanRecord } from '../../types/scan';
import { buildEnhancedIpResponse, buildAsnAnalysis } from '../asnAnalysis';

describe('input and observation boundaries', () => {
  it('accepts compressed IPv6 and rejects ambiguous or malformed IPv4', () => {
    expect(parseIP('2606:4700:4700::1111')).toMatchObject({ family: 6, category: 'public' });
    for (const value of ['999.1.1.1', '01.1.1.1', '1.1.1', 'https://1.1.1.1', '1.1.1.1/24', '1:::2', 'fe80::1%en0'])
      expect(parseIP(value)).toBeNull();
    expect(parseIP('::1')?.category).toBe('loopback');
    expect(parseIP('::ffff:c0a8:1')?.category).toBe('private');
    expect(parseIP('2001:db8::1')?.category).toBe('reserved');
    expect(parseIP('192.0.0.9')?.category).toBe('public');
  });
  it('strictly validates ASN and does not fabricate coverage', () => {
    expect(parseASN('AS13335')).toBe(13335);
    for (const input of ['13335x', '1.2', '-1', '0', '4294967295', '23456']) expect(parseASN(input)).toBeNull();
    expect(buildAsnAnalysis(12345).status).toBe('no-result');
    expect(buildAsnAnalysis(13335, { country: 'JP' }).info.country).toBe('US');
  });
  it('preserves zero values and refuses absent legacy risk', () => {
    const result = buildEnhancedIpResponse('1.1.1.1', { riskScore: 0, latitude: 0, longitude: 0 });
    expect(result.risk_assessment.overall_score).toBe(0);
    expect(result.geolocation.latitude).toBe(0);
    expect(buildEnhancedIpResponse('1.1.1.1', { riskScore: 0 }).geolocation.latitude).toBeUndefined();
    expect(() => buildEnhancedIpResponse('1.1.1.1', {})).toThrow('unavailable');
  });
});

describe('in-flight ownership', () => {
  it('shares a request beyond the old five second window', async () => {
    vi.useFakeTimers();
    try {
      const dedupe = new RequestDeduplicator();
      let finish!: (value: number) => void;
      const call = vi.fn(
        () =>
          new Promise<number>(resolve => {
            finish = resolve;
          })
      );
      const first = dedupe.deduplicate('ip', call);
      await vi.advanceTimersByTimeAsync(6000);
      const second = dedupe.deduplicate('ip', call);
      expect(first).toBe(second);
      expect(call).toHaveBeenCalledTimes(1);
      finish(1);
      await first;
      expect(dedupe.size).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });
  it('an older completion cannot delete a replacement after clear', async () => {
    const dedupe = new RequestDeduplicator();
    let finish!: () => void;
    const first = dedupe.deduplicate(
      'ip',
      () =>
        new Promise<void>(r => {
          finish = r;
        })
    );
    await Promise.resolve();
    dedupe.clear();
    let finishSecond!: () => void;
    const second = dedupe.deduplicate(
      'ip',
      () =>
        new Promise<void>(r => {
          finishSecond = r;
        })
    );
    await Promise.resolve();
    finish();
    await first;
    expect(dedupe.size).toBe(1);
    finishSecond();
    await second;
    expect(dedupe.size).toBe(0);
  });
});

const record = (version = '2'): ScanRecord => ({
  schemaVersion: 2,
  collectorVersion: version,
  rulesVersion: 'observations-1',
  scanId: version,
  name: 'baseline',
  subject: 'current-environment',
  scope: ['http'],
  startedAt: 1,
  completedAt: 2,
  fingerprint: { userAgent: 'example browser' },
  observations: {
    http: { status: 'observed', value: '1.1.1.1', source: 'HTTP', observedAt: 1, limitation: 'one request' },
  },
});
it('comparison distinguishes changes, missing and incompatible measurements', () => {
  const before = record(),
    after = record();
  after.observations.http.value = '8.8.8.8';
  expect(compareScans(before, after)[0].status).toBe('changed');
  expect(compareScans(before, record('3'))[0].status).toBe('incomparable');
  after.observations.http.status = 'unavailable';
  after.observations.http.value = null;
  expect(compareScans(before, after)[0].status).toBe('missing');
});

it('cancels one subscriber while another continues the shared lookup', async () => {
  const dedupe = new RequestDeduplicator();
  const cancelled = new AbortController();
  const remaining = new AbortController();
  let shared!: AbortSignal;
  let finish!: (value: number) => void;
  const work = vi.fn((signal: AbortSignal) => {
    shared = signal;
    return new Promise<number>(resolve => {
      finish = resolve;
    });
  });
  const first = dedupe.deduplicate('ip', work, cancelled.signal);
  const rejected = expect(first).rejects.toMatchObject({ name: 'AbortError' });
  const second = dedupe.deduplicate('ip', work, remaining.signal);
  await Promise.resolve();
  cancelled.abort();
  await rejected;
  expect(shared.aborted).toBe(false);
  expect(work).toHaveBeenCalledTimes(1);
  finish(42);
  expect(await second).toBe(42);
  expect(dedupe.size).toBe(0);
});
it('aborts upstream only when the final subscriber cancels and permits a fresh request', async () => {
  const dedupe = new RequestDeduplicator();
  const a = new AbortController();
  const b = new AbortController();
  let shared!: AbortSignal;
  const work = vi.fn((signal: AbortSignal) => {
    shared = signal;
    return new Promise<never>((_resolve, reject) =>
      signal.addEventListener('abort', () => reject(signal.reason), { once: true })
    );
  });
  const first = dedupe.deduplicate('ip', work, a.signal);
  const firstRejected = expect(first).rejects.toMatchObject({ name: 'AbortError' });
  const second = dedupe.deduplicate('ip', work, b.signal);
  const secondRejected = expect(second).rejects.toMatchObject({ name: 'AbortError' });
  await Promise.resolve();
  a.abort();
  expect(shared.aborted).toBe(false);
  b.abort();
  expect(shared.aborted).toBe(true);
  await Promise.all([firstRejected, secondRejected]);
  expect(await dedupe.deduplicate('ip', async () => 99)).toBe(99);
  expect(dedupe.size).toBe(0);
});
