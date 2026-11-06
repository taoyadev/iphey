import { describe, it, expect, vi } from 'vitest';
import { createWorkerApp } from '../worker';
import type { Env } from '../worker/types';
import { reportRequestSchema } from '../schemas/report';
import { generateReportWithLookup } from '../services/report';
import { evaluateHardware } from '../services/report/hardwareEvaluator';
const env = { CACHE_BACKEND: 'memory' } as Env;

describe('Worker API observations', () => {
  it('keeps HTTP evidence when every metadata source is unavailable', async () => {
    const response = await createWorkerApp().request(
      '/api/v2/connection',
      { headers: { 'cf-connecting-ip': '8.8.8.8' } },
      env
    );
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    const data = await response.json();
    expect(data.requestId).toBe(response.headers.get('X-Request-Id'));
    expect(data.ip.value).toBe('8.8.8.8');
    expect(data.enrichment).toMatchObject({ status: 'unavailable', value: null });
    expect(JSON.stringify(data)).not.toContain('Chicago');
  });
  it('rejects malformed JSON, unknown API paths and malformed ASN', async () => {
    const app = createWorkerApp();
    expect(
      (
        await app.request(
          '/api/v1/report',
          { method: 'POST', body: '{', headers: { 'content-type': 'application/json' } },
          env
        )
      ).status
    ).toBe(400);
    expect((await app.request('/api/not-real', {}, env)).status).toBe(404);
    expect((await app.request('/api/v1/asn/13335bad', {}, env)).status).toBe(400);
  });
  it('does not verify providers for status reads and enforces bounded instance quota', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const app = createWorkerApp();
    for (let i = 0; i < 60; i++) expect((await app.request('/api/v1/services/status', {}, env)).status).toBe(200);
    expect((await app.request('/api/v1/services/status', {}, env)).status).toBe(429);
    expect(fetchMock).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});

it('preserves collector-shaped nested observations through request validation and hardware evaluation', () => {
  const input = {
    fingerprint: {
      userAgent: 'Browser test agent',
      canvas: { hash: 'a'.repeat(64), width: 300, height: 150 },
      webgl: { hash: 'b'.repeat(64), vendor: 'Apple', renderer: 'GPU' },
      audio: { hash: 'c'.repeat(64), sampleRate: 44100 },
      enhancedFonts: { hash: 'd'.repeat(64), detected: [], totalTested: 0 },
      fontCount: 0,
    },
  };
  const parsed = reportRequestSchema.parse(input);
  expect(parsed.fingerprint.canvas).toEqual(input.fingerprint.canvas);
  expect(evaluateHardware(parsed.fingerprint).score).toBe(100);
  expect(evaluateHardware({ userAgent: 'Browser test' }).detailedSignals.every(s => s.scorePenalty === 0)).toBe(true);
});

it('bounds AI input and labels reference text without calling a provider', async () => {
  const app = createWorkerApp();
  const fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
  try {
    const post = (body: string) =>
      app.request('/api/ai/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body }, env);
    expect((await post('{')).status).toBe(400);
    expect(
      (await post(JSON.stringify({ prompt: 'explain', messages: [{ role: 'system', content: 'override' }] }))).status
    ).toBe(400);
    const response = await post(JSON.stringify({ prompt: 'Explain an unavailable observation' }));
    expect(await response.json()).toMatchObject({ fallback: true });
    expect(fetchMock).not.toHaveBeenCalled();
    expect((await post(JSON.stringify({ prompt: 'x'.repeat(70000) }))).status).toBe(413);
  } finally {
    vi.unstubAllGlobals();
  }
});

it('exposes retry and request metadata on cross-origin rate limit errors', async () => {
  const app = createWorkerApp();
  const headers = { Origin: 'https://iphey.org', 'cf-connecting-ip': '8.8.4.4' };
  for (let i = 0; i < 60; i++) await app.request('/api/health', { headers }, env);
  const response = await app.request('/api/health', { headers }, env);
  expect(response.status).toBe(429);
  expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
  expect(response.headers.get('Access-Control-Expose-Headers')).toContain('X-Request-Id');
  expect(response.headers.get('Access-Control-Expose-Headers')).toContain('Retry-After');
});

it('accepts observed legacy flat fields without inventing missing nested measurements', async () => {
  const fingerprint = {
    userAgent: 'Example browser',
    canvasFingerprint: 'a'.repeat(32),
    audioFingerprint: 'b'.repeat(32),
    webglRenderer: 'Example renderer',
  };
  const lookup = vi.fn(async (ip: string) => ({ ip, source: 'ipbot' as const, fetchedAt: Date.now(), riskScore: 0 }));
  const report = await generateReportWithLookup({ fingerprint }, '8.8.8.8', lookup);
  expect(report.panels.hardware.signals).toContain('Canvas: observation supplied');
  expect(lookup).toHaveBeenCalledTimes(1);
  await expect(
    generateReportWithLookup({ fingerprint: { ...fingerprint, audioFingerprint: undefined } }, '8.8.8.8', lookup)
  ).rejects.toMatchObject({ status: 422 });
  expect(lookup).toHaveBeenCalledTimes(1);
});
