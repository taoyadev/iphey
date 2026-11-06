import { it, expect, vi } from 'vitest';
vi.mock('../fingerprint', () => ({
  collectBasicFingerprint: () => ({ userAgent: 'Example browser', timezone: 'Etc/UTC' }),
  collectCanvas: async () => ({ hash: 'a'.repeat(64), width: 300, height: 150 }),
  collectWebGL: vi.fn(),
  collectAudio: vi.fn(),
  collectFonts: vi.fn(),
  collectPermissions: vi.fn(),
  boundedProbe: (fn: () => Promise<unknown>) => fn(),
}));
import { runScan } from '../scan';
it('keeps the basic browser snapshot separate from later high-entropy probe values', async () => {
  const result = await runScan('canvas', false, new AbortController().signal, () => undefined);
  expect(result.fingerprint.canvas?.hash).toBe('a'.repeat(64));
  expect(result.observations.canvas.value).toMatchObject({ hash: 'a'.repeat(64) });
  expect(result.observations.browser.value).not.toHaveProperty('canvas');
  expect(result.collectorVersion).toBe('2.0.1');
});
