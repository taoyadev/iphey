# IPhey Browser Fingerprint Intelligence

## Needs

- IPbot API key (`IPBOT_API_KEY`) stored in Cloudflare Worker/GitHub secrets.
- Cloudflare account/API token for Worker and Pages deployment.
- Optional fallback/enrichment credentials: `IPINFO_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_RADAR_TOKEN`, `ABUSEIPDB_API_KEY`.

## Vision & Success Criteria

- Provide a one-stop digital identity report that blends IP reputation, location fidelity, and browser fingerprint consistency.
- Let fraud analysts, privacy-conscious users, and QA engineers validate a browser/session setup quickly with clear scoring and remediation hints.
- Keep the production API on a single Cloudflare Worker runtime so provider logic cannot drift between Node and Worker implementations.

## Goals / Non-Goals

| Goals                                                                                                                  | Non-Goals                                                              |
| ---------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Ship a typed Cloudflare Worker API with clear `clients/`, `services/`, `utils/`, and `types/` boundaries               | Building a separate mobile app                                         |
| Use IPbot as the primary IP intelligence provider with ipinfo/Radar as optional fallback                               | Running arbitrary third-party scanners or storing historical user data |
| Mirror the fingerprint panels (Browser, Location, IP, Hardware, Software) with accessible UI and deterministic scoring | Re-implementing low-level fingerprinting logic from scratch            |
| Keep secrets out of git and configure production through Worker/GitHub secrets                                         | Maintaining a parallel Node/Express production runtime                 |

## System Architecture

- **Frontend**: Next.js 14 app under `apps/web-next`, deployed to Cloudflare Pages. It consumes the Worker API through `NEXT_PUBLIC_API_URL`.
- **Backend**: Single Cloudflare Worker. Entry point: `src/worker.ts`; runtime bindings: `src/worker/types.ts`; deployment config: `wrangler.toml`.
- **Cache**: Cloudflare KV via `IP_CACHE` in production; memory cache for tests/local tooling.
- **IP Provider Chain**: `src/services/ipService.worker.ts` uses IPbot first, then ipinfo/Radar fallback when configured.
- **IPbot Client**: `src/clients/ipbotClient.ts` calls `GET {origin}/v1/ip/{ip}` with `X-API-Key`, parses `X-RateLimit-*`, honors `Retry-After`, and retries 429/5xx/network failures.

## API Surface

| Route                     | Method | Description                                                       |
| ------------------------- | ------ | ----------------------------------------------------------------- |
| `/api/health`             | GET    | Worker health and cache metadata                                  |
| `/api/v1/services/status` | GET    | Provider readiness including IPbot                                |
| `/api/v1/ip`              | GET    | Client IP lookup using Cloudflare headers when present            |
| `/api/v1/ip/:ip`          | GET    | Normalized IP lookup for a supplied IP                            |
| `/api/v1/ip/enhanced`     | GET    | Client IP enriched response for frontend compatibility            |
| `/api/v1/ip/:ip/enhanced` | GET    | Supplied IP enriched response for frontend compatibility          |
| `/api/v1/report`          | POST   | Browser fingerprint report with IP intelligence and panel scoring |

## External Integrations & Secrets

- `IPBOT_API_KEY`: primary provider secret. Store with `wrangler secret put IPBOT_API_KEY` and GitHub Actions secret `IPBOT_API_KEY`.
- `IPINFO_TOKEN`: optional fallback.
- `CLOUDFLARE_RADAR_TOKEN` + `CLOUDFLARE_ACCOUNT_ID`: optional Radar fallback and verification.
- `ABUSEIPDB_API_KEY`: optional enrichment for helper services.

Never hard-code keys or commit `.env`/deployment secret files.

## Scoring & Cache Policy

- Browser, Location, IP Address, Hardware, and Software panels each emit `status`, `score`, and `signals`.
- Global verdict is derived from weighted panel scores.
- Clean IPbot results default to 24h cache TTL.
- High-risk IPbot results default to 1h cache TTL so suspicious IPs are re-evaluated sooner.
- Normalized Worker responses are cached in KV with the provider-appropriate TTL.

## Quality Gates

- Pull requests run typecheck, API lint, API tests, and frontend lint.
- Pushes to `main` run those gates before Worker/Pages deploy.
- Tests use injected fetch/cache functions and dummy env so they do not call real upstream APIs.

## Open Questions

- Confirm production custom domains for Worker and Pages.
- Decide whether optional fallback providers remain long-term after IPbot production data has enough uptime evidence.
