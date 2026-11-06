import assert from 'node:assert/strict';
import { startBrowserApiFixture } from './browser-api-fixture.mjs';
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
const require = createRequire(import.meta.url);
const { chromium } = require('/Users/openclaw/node_modules/playwright');
const base = (process.env.OPENCLAW_PREVIEW_URL || process.env.OPENCLAW_TARGET_URL || '').replace(/\/$/, '');
if (!base || !/^http:\/\/127\.0\.0\.1:\d+$/.test(base.replace(/\/$/, '')))
  throw new Error('Task-owned loopback managed preview required');
const out = process.env.OPENCLAW_ARTIFACT_DIR || 'output/playwright';
await mkdir(out, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
});
const apiFixture = process.env.IPHEY_HTTP_INTEGRATION === '1' ? await startBrowserApiFixture() : null;
const checks = [];
let activePage;
const verify = (name, condition) => {
  assert.ok(condition, name);
  checks.push(name);
};
let exitIP = '1.1.1.1',
  failure = false,
  delay = 0,
  requests = 0;
let delayedReply = Promise.resolve();
try {
  const nojs = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const first = await nojs.newPage();
  await first.goto(base, { waitUntil: 'domcontentloaded' });
  verify(
    'first render contains task and truthful idle state',
    (await first.locator('body').innerText()).includes('No check has run yet.')
  );
  await first.screenshot({ path: `${out}/mobile-first-render.png`, fullPage: false });
  verify(
    'initial action stays disabled until client controls are bound',
    await first.getByRole('button', { name: 'Run check', exact: true }).isDisabled()
  );
  await nojs.close();
  const bootstrap = await browser.newContext({ viewport: { width: 390, height: 844 } });
  let releaseScripts;
  const scriptGate = new Promise(resolve => {
    releaseScripts = resolve;
  });
  let earlyApiRequests = 0;
  await bootstrap.route('**/_next/static/**/*.js', async route => {
    await scriptGate;
    await route.continue();
  });
  await bootstrap.route('**/api/**', async route => {
    earlyApiRequests++;
    await route.abort();
  });
  try {
    const bootPage = await bootstrap.newPage();
    await bootPage.goto(base, { waitUntil: 'commit' });
    const action = bootPage.getByRole('button', { name: 'Run check', exact: true });
    await action.waitFor();
    verify('slow JavaScript cannot expose an unbound active action', await action.isDisabled());
    releaseScripts();
    await bootPage.waitForFunction(() => !document.querySelector('#interactive-analysis button')?.disabled);
    verify('action becomes usable after client initialization', await action.isEnabled());
    verify('bootstrap itself does not start measurement requests', earlyApiRequests === 0);
  } finally {
    releaseScripts();
    await bootstrap.close();
  }
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  activePage = page;
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await context.route('**/api/**', async route => {
    if (apiFixture && new URL(route.request().url()).origin === apiFixture.url) return route.continue();
    requests++;
    const requestedIP = exitIP;
    if (delay) {
      delayedReply = new Promise(r => setTimeout(r, delay));
      await delayedReply;
    }
    const pathname = new URL(route.request().url()).pathname;
    if (apiFixture) {
      apiFixture.configure({ ip: requestedIP, unavailable: failure });
      return route.fulfill({
        status: 307,
        headers: {
          Location: apiFixture.url + new URL(route.request().url()).pathname + new URL(route.request().url()).search,
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
    if (failure)
      return route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'QA_UNAVAILABLE' }),
      });
    const observedAt = Date.now();
    if (pathname === '/api/v2/connection')
      return route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          schemaVersion: 2,
          requestId: 'qa-request',
          ip: {
            status: 'observed',
            value: requestedIP,
            source: 'QA HTTP fixture',
            observedAt,
            limitation: 'Mocked upstream for browser regression only',
          },
          enrichment: {
            status: 'unavailable',
            value: null,
            source: 'QA provider fixture',
            observedAt,
            limitation: 'No provider metadata',
          },
        }),
      });
    if (pathname.startsWith('/api/ip/'))
      return route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          ip: decodeURIComponent(pathname.slice(8)),
          source: 'ipinfo',
          fetchedAt: observedAt,
          org: 'QA fixture',
          asn: 'AS13335',
          latitude: 0,
          longitude: 0,
          riskScore: 0,
          cacheStatus: 'fresh',
        }),
      });
    if (pathname.startsWith('/api/v1/asn/'))
      return route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          asn: Number(pathname.split('/').pop()),
          status: 'no-result',
          source: 'built-in-directory',
          sourceDate: null,
        }),
      });
    if (pathname === '/api/ai/chat')
      return route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({ content: 'QA reference explanation', fallback: true }),
      });
    return route.fulfill({ status: 404, body: 'unknown fixture' });
  });
  await page.goto(base, { waitUntil: 'domcontentloaded' });
  await writeFile(`${out}/initial-dom.txt`, await page.locator('body').innerText());
  await page.getByRole('button', { name: 'Run check', exact: true }).waitFor();
  await page.addScriptTag({ path: '/Users/openclaw/node_modules/axe-core/axe.min.js' });
  const accessibility = await page.evaluate(async () =>
    window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] } })
  );
  await writeFile(`${out}/accessibility.json`, JSON.stringify(accessibility.violations, null, 2));
  verify('core workspace passes automated WCAG checks', accessibility.violations.length === 0);
  verify('no automatic probes or API calls before action', requests === 0);
  await page.getByRole('checkbox', { name: 'Include Canvas' }).check();
  await page.getByRole('button', { name: 'Run check', exact: true }).click();
  await page.getByRole('button', { name: 'Save on this device', exact: true }).waitFor({ timeout: 15000 });
  verify('one click starts exactly one connection request', requests === 1);
  await page.getByLabel('Record name', { exact: true }).fill('VPN off');
  await page.getByRole('button', { name: 'Save on this device', exact: true }).click();
  await page.getByText('Saved on this device. Open Compare to select the baseline.').waitFor();
  const baseline = await page.evaluate(() => JSON.parse(localStorage.getItem('iphey-scans-v2'))[0]);
  verify('real browser Canvas collection supplies nested hash', typeof baseline.fingerprint.canvas?.hash === 'string');
  verify(
    'browser collector record retains schema and scope',
    baseline.schemaVersion === 2 && baseline.scope.includes('canvas')
  );
  const backendRequire = createRequire(new URL('../apps/web-next/package.json', import.meta.url));
  backendRequire('tsx/cjs');
  const { reportRequestSchema } = require('../src/schemas/report.ts');
  const parsed = reportRequestSchema.parse({ fingerprint: baseline.fingerprint });
  verify(
    'real collector output survives backend schema',
    parsed.fingerprint.canvas.hash === baseline.fingerprint.canvas.hash
  );
  exitIP = '8.8.8.8';
  await page.getByRole('button', { name: 'Run check again', exact: true }).click();
  await page.getByRole('button', { name: 'Save on this device', exact: true }).waitFor();
  await page.getByLabel('Record name', { exact: true }).fill('VPN on');
  await page.getByRole('button', { name: 'Save on this device', exact: true }).click();
  await page.getByText('Saved on this device. Open Compare to select the baseline.').waitFor();
  verify(
    'two separate scans saved before navigation',
    (await page.evaluate(() => JSON.parse(localStorage.getItem('iphey-scans-v2')).length)) === 2
  );
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: `${out}/desktop-report.png`, fullPage: false });
  await page.goto(`${base}/compare`);
  await page.getByText('2 records on this device.').waitFor();
  verify(
    'comparison identifies changed HTTP exit',
    (await page.locator('body').innerText()).includes('http · changed')
  );
  await page.evaluate(() => localStorage.setItem('iphey-history', '{bad'));
  await page.getByRole('button', { name: 'Refresh saved records', exact: true }).click();
  await page.getByText('Legacy history is unavailable or invalid.', { exact: false }).waitFor();
  verify(
    'damaged legacy history does not block current records',
    await page.getByText('2 records on this device.', { exact: true }).isVisible()
  );
  await page.evaluate(() =>
    localStorage.setItem('iphey-history', JSON.stringify([{ id: 'qa-legacy', timestamp: 1, score: 90 }]))
  );
  await page.getByRole('button', { name: 'Refresh saved records', exact: true }).click();
  await page.getByText('View retained legacy records', { exact: true }).click();
  verify(
    'legacy records remain readable without migration',
    await page.getByText('Legacy record ·', { exact: false }).isVisible()
  );
  await page.goto(`${base}/ip`);
  await page.getByRole('button', { name: 'Lookup IP', exact: true }).click();
  await page.getByText('Enter one valid IPv4 or IPv6 address', { exact: false }).waitFor();
  const beforePrivate = requests;
  await page.getByLabel('IPv4 or IPv6 address').fill('192.168.1.1');
  await page.getByRole('button', { name: 'Lookup IP', exact: true }).click();
  await page.getByText('Special-use address.', { exact: false }).waitFor();
  verify('private IP is classified without network', requests === beforePrivate);
  await page.getByLabel('IPv4 or IPv6 address').fill('2606:4700:4700::1111');
  await page.getByRole('button', { name: 'Lookup IP', exact: true }).click();
  await page.getByText('Lookup finished.', { exact: false }).waitFor();
  verify(
    'IPv6 object preserved in query result',
    (await page.locator('body').innerText()).includes('2606:4700:4700::1111')
  );
  await page.goto(`${base}/ip/8.8.8.8`);
  verify(
    'seed detail keeps the original query',
    (await page.getByLabel('IPv4 or IPv6 address').inputValue()) === '8.8.8.8'
  );
  await page.reload();
  verify(
    'seed direct refresh preserves query',
    (await page.getByLabel('IPv4 or IPv6 address').inputValue()) === '8.8.8.8'
  );
  await page.goto(`${base}/leaks`);
  failure = true;
  await page.getByRole('button', { name: 'Run check', exact: true }).click();
  await page.getByText(/Check finished with/).waitFor();
  verify(
    'failed leak check has no trustworthy verdict',
    !(await page.locator('body').innerText()).includes('trustworthy')
  );
  verify(
    'DNS capability is explicitly unavailable',
    (await page.locator('body').innerText()).includes('DNS resolver test unavailable')
  );
  failure = false;
  delay = 1000;
  await page.getByRole('button', { name: 'Run check again', exact: true }).click();
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await page.getByText('Check cancelled.', { exact: false }).waitFor();
  delay = 0;
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(base);
  await page.getByRole('button', { name: 'Run check', exact: true }).focus();
  await page.keyboard.press('Enter');
  await page.getByRole('button', { name: 'Save on this device', exact: true }).waitFor();
  await delayedReply;
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(resolve)));
  verify(
    'cancelled older request does not overwrite the current exit',
    (await page.locator('body').innerText()).includes('HTTP exit: 8.8.8.8')
  );
  verify(
    'mobile has no horizontal overflow',
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)
  );
  await page.evaluate(() => {
    Storage.prototype.setItem = function () {
      throw new DOMException('full', 'QuotaExceededError');
    };
  });
  await page.getByRole('button', { name: 'Save on this device', exact: true }).click();
  await page.getByText('Could not save on this device.', { exact: false }).waitFor();
  verify(
    'storage failure leaves current evidence available',
    await page.getByText('Observed evidence', { exact: true }).isVisible()
  );
  await page.screenshot({ path: `${out}/mobile-report.png`, fullPage: false });
  await context.addInitScript(() => {
    const Original = window.RTCPeerConnection;
    window.__ipheyClosed = 0;
    if (Original)
      window.RTCPeerConnection = class extends Original {
        close() {
          window.__ipheyClosed++;
          return super.close();
        }
      };
  });
  await page.goto(`${base}/fingerprinting/webrtc`);
  await page.getByRole('button', { name: 'Run check', exact: true }).click();
  await page.getByRole('button', { name: 'Save on this device', exact: true }).waitFor({ timeout: 10000 });
  verify('real WebRTC gathering closes its connection', (await page.evaluate(() => window.__ipheyClosed)) > 0);
  verify(
    'real WebRTC result includes no all-clear verdict',
    !(await page.locator('body').innerText()).includes('trustworthy')
  );
  await page.goto(base);
  await page.getByText('Advanced: repeat basic checks', { exact: true }).click();
  await page.getByRole('button', { name: 'Start sampling', exact: true }).click();
  await page.getByText('Sample completed.', { exact: false }).waitFor();
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await page.getByText('Paused.', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Stop', exact: true }).click();
  await page.getByText('Stopped. In-flight work cancelled.', { exact: true }).waitFor();
  verify('monitor start, pause and stop controls work', true);
  verify('no browser page errors', errors.length === 0);
  const unknown = await page.goto(`${base}/not-a-real-route`);
  verify('unknown static route remains 404', unknown.status() === 404);
  const sitemapResponse = await context.request.get(`${base}/sitemap.xml`);
  const sitemap = await sitemapResponse.text();
  const paths = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => new URL(match[1]).pathname);
  const requestsBeforePages = requests;
  for (const path of paths) {
    const response = await page.goto(`${base}${path}`, { waitUntil: 'domcontentloaded' });
    verify(
      `static route ${path} responds and has one task heading`,
      response.status() === 200 && (await page.locator('h1').count()) === 1
    );
    verify(
      `mobile route ${path} stays within viewport`,
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)
    );
  }
  verify('visiting every published route does not automatically query APIs', requests === requestsBeforePages);
  if (apiFixture) {
    const waitFor = async promise => {
      let timer;
      try {
        return await Promise.race([
          promise,
          new Promise((_, reject) => {
            timer = setTimeout(() => reject(new Error('HTTP cancellation did not reach provider')), 5000);
          }),
        ]);
      } finally {
        clearTimeout(timer);
      }
    };
    apiFixture.configure({ ip: '9.9.9.9', unavailable: false, delayMs: 10000 });
    const started = apiFixture.nextProviderStart();
    const aborted = apiFixture.nextProviderAbort();
    const controller = new AbortController();
    const request = fetch(`${apiFixture.url}/api/v2/connection`, { signal: controller.signal });
    const rejected = assert.rejects(request, { name: 'AbortError' });
    await waitFor(started);
    controller.abort();
    await rejected;
    await waitFor(aborted);
    verify(
      'HTTP disconnect propagates to the provider AbortSignal',
      apiFixture.counters.providerDisconnectAborts === 1
    );
  }
  await context.close();
  await writeFile(
    `${out}/browser-results.json`,
    JSON.stringify(
      {
        checks,
        requests,
        errors,
        scope: apiFixture
          ? 'Real browser and loopback HTTP through application Hono API; synthetic provider responses and proxy IP; not Cloudflare or live-provider verification'
          : 'Real browser probes with explicitly mocked API data; no production or provider verification',
        apiCounters: apiFixture?.counters,
      },
      null,
      2
    )
  );
  console.log(JSON.stringify({ passed: checks.length, checks, artifactDir: out }));
} catch (error) {
  if (activePage && !activePage.isClosed()) {
    await writeFile(`${out}/failure-dom.txt`, await activePage.locator('body').innerText());
    await activePage.screenshot({ path: `${out}/failure.png`, fullPage: false });
  }
  throw error;
} finally {
  await browser.close();
  await apiFixture?.close();
}
