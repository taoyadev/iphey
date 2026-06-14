# Configuration & Secrets

Cloudflare Worker runtime configuration comes from `wrangler.toml` vars and Worker secrets. Local tooling that imports `src/config.ts` is still validated via Zod and refuses to run unless an IP intelligence provider is available.

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
- Production deployments should pull secrets from Cloudflare Workers secrets and GitHub Actions secrets.
- Set the primary provider with `wrangler secret put IPBOT_API_KEY` or the `IPBOT_API_KEY` GitHub secret.
- If you rotate IPbot, ipinfo, or Radar credentials, update the corresponding Worker/GitHub secret and redeploy.

## Operational Checklist

1. Copy `.env.example` to `.env` for local tooling or configure Worker vars/secrets in Cloudflare.
2. Set `IPBOT_API_KEY` for production.
3. Run `npm run dev` to start Wrangler and check `/api/v1/services/status` reports `ipbot: true`.
4. CI uses dummy provider env from `vitest.config.ts` for tests and never hits real upstreams.
5. Keep IPbot TTLs aligned with quota: clean results default to 24h, high-risk results default to 1h.
