import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
const require = createRequire(import.meta.url);
const { chromium } = require('/Users/openclaw/node_modules/playwright');
const expected =
  process.argv[2] ||
  process.env.IPHEY_RELEASE_SHA ||
  JSON.parse(
    execFileSync(
      'curl',
      [
        '--fail',
        '--silent',
        '--show-error',
        '--max-time',
        '15',
        'https://api.github.com/repos/taoyadev/iphey/git/ref/heads/main',
      ],
      { encoding: 'utf8', timeout: 20000 }
    )
  ).object.sha;
assert.match(expected, /^[a-f0-9]{40}$/);
const target = 'https://iphey.org',
  api = 'https://api.iphey.org';
const out = process.env.OPENCLAW_ARTIFACT_DIR || 'output/playwright/production-release';
await mkdir(out, { recursive: true });
let health;
for (let attempt = 0; attempt < 18; attempt++) {
  try {
    const response = await fetch(api + '/api/health', { signal: AbortSignal.timeout(8000), cache: 'no-store' });
    if (response.ok) {
      const data = await response.json();
      if (data.release === expected) {
        health = data;
        break;
      }
    }
  } catch {}
  if (attempt < 17) await new Promise(resolve => setTimeout(resolve, 10000));
}
assert.equal(health?.release, expected, 'Canonical API must publish the expected commit');
const browser = await chromium.launch({
  headless: true,
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
});
const checks = [];
let activePage;
const networkFailures = [];
try {
  for (const [viewport, javaScriptEnabled, label] of [
    [{ width: 390, height: 844 }, false, 'first-render'],
    [{ width: 1280, height: 900 }, true, 'desktop'],
    [{ width: 390, height: 844 }, true, 'mobile'],
  ]) {
    const context = await browser.newContext({ viewport, javaScriptEnabled, reducedMotion: 'reduce' });
    const page = await context.newPage();
    activePage = page;
    page.on('requestfailed', request =>
      networkFailures.push({ url: request.url(), error: request.failure()?.errorText })
    );
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const response = await page.goto(target, { waitUntil: 'domcontentloaded' });
    assert.equal(response.status(), 200);
    assert.equal(await page.locator('meta[name="iphey-release"]').getAttribute('content'), expected);
    await page.getByRole('button', { name: 'Run check', exact: true }).waitFor();
    assert.ok((await page.locator('body').innerText()).includes('No check has run yet.'));
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({ path: `${out}/${label}.png`, fullPage: false });
    checks.push(label + ' canonical release and idle state');
    if (javaScriptEnabled && label === 'desktop') {
      const observedResponse = page.waitForResponse(
        response => response.url() === api + '/api/v2/connection' && response.request().method() === 'GET'
      );
      await page.getByRole('button', { name: 'Run check', exact: true }).click();
      const observed = await (await observedResponse).json();
      assert.equal(observed.enrichment?.status, 'observed', 'At least one live IP metadata provider must respond');
      assert.equal(observed.enrichment.value.ip, observed.ip.value);
      assert.ok(observed.enrichment.value.country || observed.enrichment.value.org || observed.enrichment.value.asn);
      await page.getByRole('button', { name: 'Save on this device', exact: true }).waitFor({ timeout: 20000 });
      const text = await page.locator('body').innerText();
      assert.ok(/HTTP exit: [0-9a-f:.]+/.test(text), 'Actual HTTP exit must be observed');
      assert.ok(await page.getByText('Observed evidence', { exact: true }).isVisible());
      checks.push('real current-connection check completed');
      for (const route of [
        '/ip',
        '/asn',
        '/compare',
        '/leaks',
        '/docs',
        '/api-reference',
        '/privacy',
        '/fingerprinting/canvas',
      ]) {
        const result = await page.goto(target + route, { waitUntil: 'domcontentloaded' });
        assert.equal(result.status(), 200);
        assert.equal(await page.locator('h1').count(), 1);
        assert.equal(await page.locator('meta[name="iphey-release"]').getAttribute('content'), expected);
        checks.push(route + ' published task route');
      }
      const missing = await page.goto(target + '/release-check-not-a-real-page');
      assert.equal(missing.status(), 404);
      checks.push('canonical 404');
    }
    assert.deepEqual(errors, []);
    await context.close();
  }
  await writeFile(
    `${out}/production-results.json`,
    JSON.stringify(
      {
        expected,
        health,
        checks,
        target,
        api,
        scope: 'Canonical public URLs; real browser; one bounded live connection check; no request mocks',
      },
      null,
      2
    )
  );
  console.log(JSON.stringify({ expected, checks, target, api, artifactDir: out }));
} catch (error) {
  if (activePage && !activePage.isClosed()) {
    await writeFile(`${out}/failure-dom.txt`, await activePage.locator('body').innerText());
    await writeFile(`${out}/network-failures.json`, JSON.stringify(networkFailures, null, 2));
  }
  throw error;
} finally {
  await browser.close();
}
