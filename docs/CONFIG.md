# Configuration & Secrets

Cloudflare Worker runtime configuration comes from `wrangler.toml` vars plus GitHub Actions or Worker secrets. The production stack is `Cloudflare Worker + Cloudflare Pages`; there is no parallel production Node/Express runtime.

| Variable                       | Required    | Description                                                                                                   |
| ------------------------------ | ----------- | ------------------------------------------------------------------------------------------------------------- |
| `NODE_ENV`                     | optional    | `development`, `test`, or `production` (defaults to `development`).                                           |
| `IPBOT_API_ORIGIN`             | optional    | IPbot API origin. Defaults to `https://api.ipbot.com`.                                                        |
| `IPBOT_API_KEY`                | conditional | Primary IP intelligence source for production. Store as a Worker/GitHub secret, never in repo files.          |
| `IPBOT_TIMEOUT_MS`             | optional    | IPbot request timeout (default 4000 ms).                                                                      |
| `IPBOT_MAX_RETRIES`            | optional    | IPbot retry count for 429/5xx/network errors (default 3).                                                     |
| `CACHE_TTL_IPBOT_MS`           | optional    | Clean IPbot result TTL (default 24 hours).                                                                    |
| `CACHE_TTL_IPBOT_HIGH_RISK_MS` | optional    | High-risk IPbot result TTL (default 1 hour).                                                                  |
| `IPINFO_TOKEN`                 | conditional | Optional fallback source. Required only when IPbot is not configured and the Cloudflare Radar pair is absent. |
| `CLOUDFLARE_ACCOUNT_ID`        | conditional | Required together with `CLOUDFLARE_RADAR_TOKEN` to enable Radar lookup/fallback + health verification.        |
| `CLOUDFLARE_RADAR_TOKEN`       | conditional | Bearer token used for Radar `/intelligence/ip` + `/tokens/verify` endpoints.                                  |
| `ABUSEIPDB_API_KEY`            | optional    | Optional reputation enrichment for non-Worker helper services/tests.                                          |
| `LOG_LEVEL`                    | optional    | Pino log level (`info` default).                                                                              |
| `CACHE_BACKEND`                | optional    | `kv` in Worker production, `memory` for local tests/tooling.                                                  |
| `CACHE_TTL_MS`                 | optional    | Default normalized IP insight TTL (default 300000 ms).                                                        |
| `CACHE_STALE_TTL_MS`           | optional    | Duration stale non-IPbot entries remain readable while revalidation runs (default 30 minutes).                |
| `CACHE_MAX_ITEMS`              | optional    | Max entries stored in memory cache (default 500).                                                             |
| `CLIENT_TIMEOUT_MS`            | optional    | Fallback provider HTTP timeout (default 2500 ms).                                                             |
| `SIGNING_SECRET`               | optional    | Reserved for private integrations that HMAC-sign `/api/v1/report` requests.                                   |
| `CREEPJS_ASSETS_PATH`          | optional    | Path to fingerprint helper assets; defaults to `../creepjs/dist` for compatibility with the local dataset.    |

## Secrets Handling

- Never commit `.env` or any real tokens. `.env.example` exists for structure only.
- Local `wrangler dev` secrets belong in `./.dev.vars` only.
- Production deployments should pull secrets from Cloudflare Workers secrets and GitHub Actions secrets.
- Set the primary provider with `wrangler secret put IPBOT_API_KEY` or the `IPBOT_API_KEY` GitHub secret.
- If you rotate IPbot, ipinfo, or Radar credentials, update the corresponding Worker/GitHub secret and redeploy.
- The canonical secret-location record and release checklist live in [`docs/DIRECT_DEPLOY.md`](./DIRECT_DEPLOY.md).

## Operational Checklist

1. Put local Worker secrets in `./.dev.vars` or configure Worker vars/secrets in Cloudflare.
2. Set `IPBOT_API_KEY` for production.
3. Run `npm run dev` to start Wrangler and check `/api/v1/services/status` reports `ipbot: true`.
4. CI uses dummy provider env from `vitest.config.ts` for tests and never hits real upstreams.
5. Keep IPbot TTLs aligned with quota: clean results default to 24h, high-risk results default to 1h.


## Observation workspace (2026-11-06)

The primary browser workspace uses local schema v2 observations and
`GET /api/v2/connection`; it does not POST fingerprints. Legacy `/api/v1/report`
requires complete measured hardware fields (nested or legacy flat) and provider risk evidence.

IP lookups attempt at most one request per configured provider (IPbot, IPinfo,
Radar), with a shared 7.5-second provider deadline. `IPBOT_MAX_RETRIES` no longer
expands the interactive Worker lookup budget. The standalone IPbot client retains
its own configured retry behavior. Cache keys use `ip-observed-v2:`; old fabricated
results are not reused. Stale refresh is synchronous and deduplicated with misses;
failed refresh retains a result only inside its maximum age. Visitor requests do
not trigger bulk warming; the scheduled handler remains the warming owner.

Optional explanations require both `OPENROUTER_API_KEY` (Worker secret) and
`OPENROUTER_MODEL` (explicit deployment model identifier). Without a model or key,
the API returns labeled reference text. One model is attempted with a 15-second
deadline; the browser has a 20-second deadline and cancellation. No credentials
were provisioned or provider calls made by implementation tests.

API bodies are limited to 64 KiB; each Worker app instance admits at most 60 API
requests per observed client IP per minute, with a bounded 5,000-entry map. This
is not a globally coordinated quota. Service status is an instance observation,
not a live provider health guarantee.


## Cancellation and cache validation follow-up

`lookupIpInsight(ip, signal?)` accepts a request AbortSignal. Equivalent in-flight
lookups are still shared per service instance: cancelling one caller detaches
that caller, and cancelling the final caller aborts cooperative provider fetches.
The Worker passes the incoming request signal into all interactive lookup paths,
including legacy reports. The 7.5-second provider deadline remains independent
of caller cancellation. It is a provider budget, not a guarantee that all KV SDK
operations can be recalled once dispatched.

IPbot backoff waits now observe cancellation. IPbot cache TTL is chosen using the
full provider result, including classification signals, rather than reconstructing
it from the numeric score alone. A score of zero remains zero.

Cached insight reuse requires a valid payload, the queried IP, and a source time
inside the configured maximum cache-age budget. KV envelopes require finite,
ordered freshness/expiry fields. Invalid entries are treated as misses. Expired
reads do not issue KV deletes. KV storage retention uses at least 60 seconds,
while application expiry continues to use the configured millisecond window.

The tracked root `.npmrc` contains public peer-resolution settings only; never
put authentication tokens in it. Existing CI quality checks include frontend
tests and the static build before the deploy job can start.
