# Configuration & Secrets

All runtime configuration flows through `src/config.ts` (validated via Zod). The service refuses to boot unless an IP intelligence provider is available. Use the table below when curating `.env` or deployment secrets:

| Variable                                  | Required    | Description                                                                                                                                                        |
| ----------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `NODE_ENV`                                | optional    | `development`, `test`, or `production` (defaults to `development`).                                                                                                |
| `PORT`                                    | optional    | Port for the Express server (default `4310`).                                                                                                                      |
| `IPINFO_TOKEN`                            | conditional | Primary IP intelligence source. Required unless the Cloudflare Radar pair is provided. Keep this token outside git; sample token from the brief must remain local. |
| `CLOUDFLARE_ACCOUNT_ID`                   | conditional | Required together with `CLOUDFLARE_RADAR_TOKEN` to enable Radar lookup/fallback + health verification.                                                             |
| `CLOUDFLARE_RADAR_TOKEN`                  | conditional | Bearer token used for Radar’s `/intelligence/ip` + `/tokens/verify` endpoints.                                                                                     |
| `LOG_LEVEL`                               | optional    | Pino log level (`info` default).                                                                                                                                   |
| `CACHE_TTL_MS`                            | optional    | LRU cache TTL for IP insights (default 300000 ms).                                                                                                                 |
| `CACHE_MAX_ITEMS`                         | optional    | Max entries stored in the in-memory cache (default 500).                                                                                                           |
| `CLIENT_TIMEOUT_MS`                       | optional    | HTTP client timeout when calling upstream APIs (default 2500 ms).                                                                                                  |
| `CREEPJS_ASSETS_PATH`                     | optional    | Path to fingerprint helper assets; defaults to `../creepjs/dist` for compatibility with the local dataset.                                                         |
| `CORS_ALLOWED_ORIGINS`                    | optional    | Comma-separated allowlist for CORS. Defaults to `*` in dev; set explicit origins in production (Pages domain + Worker domain).                                     |
| `RATE_LIMIT_WINDOW_MS` / `RATE_LIMIT_MAX` | optional    | Request limiter window + max requests (defaults: 1 minute / 60).                                                                                                   |
| `CACHE_STALE_TTL_MS`                      | optional    | Duration stale entries remain readable while revalidation runs (default 30 minutes, Worker only).                                                                  |
| `SIGNING_SECRET`                          | optional    | If set, `/api/v1/report` requires `X-IPHEY-SIGNATURE` (HMAC-SHA256 over JSON body) for private integrations.                                                       |

### Secrets handling

- Never commit `.env` or any real tokens. `.env.example` exists for structure only.
- Production deployments should pull secrets from your orchestrator (1Password Secrets Automation, Doppler, AWS Secrets Manager, etc.).
- If you rotate ipinfo or Radar credentials, restart the service so `src/config.ts` revalidates them.

### Operational Checklist

1. Copy `.env.example` to `.env` (local) or configure environment variables in your platform.
2. Run `npm run dev` to ensure `/api/health` reports `ipinfoConfigured: true` or `radarHealthy: true`.
3. For CI, export a dummy `IPINFO_TOKEN=test-token` before running `npm run lint` / `npm run test` so config parsing passes without hitting real networks.
4. Set `CORS_ALLOWED_ORIGINS` to your Pages domain and any admin domains; never leave `*` in production.
5. Keep rate limits tuned for your traffic; defaults are conservative (60 req/min) and can be raised with caution.
6. If `SIGNING_SECRET` is configured, clients must send `X-IPHEY-SIGNATURE` header (`hex(HMAC_SHA256(body, secret))`).
