// Loopback-only HTTP integration fixture. Credentials and IP data below are synthetic.
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
const require = createRequire(new URL('../apps/web-next/package.json', import.meta.url));
require('tsx/cjs');
const { createWorkerApp } = require('../../src/worker.ts');

export async function startBrowserApiFixture() {
  const app = createWorkerApp();
  const originalFetch = globalThis.fetch;
  let settings = { ip: '1.1.1.1', unavailable: false };
  let env = makeEnv();
  const counters = { httpRequests: 0, providerRequests: 0, providerAborts: 0, providerDisconnectAborts: 0 };
  let providerStarted, providerAborted;
  function makeEnv() {
    return {
      CACHE_BACKEND: 'memory',
      IPBOT_API_KEY: 'qa-fixture-placeholder',
      IPBOT_API_ORIGIN: 'https://api.ipbot.com',
    };
  }
  globalThis.fetch = async (input, init) => {
    const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url);
    if (url.origin !== 'https://api.ipbot.com') return originalFetch(input, init);
    counters.providerRequests++;
    const current = settings;
    if (current.delayMs) {
      await new Promise((resolve, reject) => {
        const signal = init.signal;
        const timer = setTimeout(() => {
          signal.removeEventListener('abort', abort);
          resolve();
        }, current.delayMs);
        const abort = () => {
          clearTimeout(timer);
          counters.providerAborts++;
          if (signal.reason?.message === 'QA HTTP client disconnected') counters.providerDisconnectAborts++;
          providerAborted?.();
          reject(signal.reason);
        };
        signal.addEventListener('abort', abort, { once: true });
        providerStarted?.();
        if (signal.aborted) abort();
      });
    }
    if (current.unavailable) return Response.json({ error: 'QA_PROVIDER_UNAVAILABLE' }, { status: 503 });
    return Response.json({
      ip: decodeURIComponent(url.pathname.slice('/v1/ip/'.length)),
      location: { country_code: 'ZZ', latitude: 0, longitude: 0, timezone: 'Etc/UTC' },
      network: { asn: 'AS13335', org: 'Synthetic HTTP integration fixture' },
      score: { risk_score: 0 },
    });
  };
  const server = createServer(async (incoming, outgoing) => {
    counters.httpRequests++;
    const controller = new AbortController();
    const disconnected = () => {
      if (!outgoing.writableFinished) controller.abort(new DOMException('QA HTTP client disconnected', 'AbortError'));
    };
    outgoing.once('close', disconnected);
    try {
      const chunks = [];
      for await (const chunk of incoming) chunks.push(chunk);
      const headers = new Headers();
      for (const [key, value] of Object.entries(incoming.headers))
        if (value !== undefined) headers.set(key, String(value));
      headers.set('cf-connecting-ip', settings.ip); // Synthetic reverse-proxy observation.
      const body = Buffer.concat(chunks);
      const response = await app.request(
        `http://127.0.0.1${incoming.url}`,
        {
          method: incoming.method,
          signal: controller.signal,
          headers,
          ...(body.length ? { body } : {}),
        },
        env
      );
      if (outgoing.destroyed) return;
      outgoing.writeHead(response.status, Object.fromEntries(response.headers));
      outgoing.end(Buffer.from(await response.arrayBuffer()));
    } catch {
      if (!outgoing.destroyed) {
        outgoing.writeHead(500);
        outgoing.end('Integration fixture failed');
      }
    } finally {
      outgoing.removeListener('close', disconnected);
    }
  });
  try {
    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(0, '127.0.0.1', resolve);
    });
    return {
      url: `http://127.0.0.1:${server.address().port}`,
      counters,
      nextProviderStart: () =>
        new Promise(resolve => {
          providerStarted = resolve;
        }),
      nextProviderAbort: () =>
        new Promise(resolve => {
          providerAborted = resolve;
        }),
      configure(next) {
        if (settings.unavailable !== next.unavailable) env = makeEnv();
        settings = { ...next };
      },
      async close() {
        globalThis.fetch = originalFetch;
        server.closeAllConnections();
        await new Promise(resolve => server.close(resolve));
      },
    };
  } catch (error) {
    globalThis.fetch = originalFetch;
    throw error;
  }
}
