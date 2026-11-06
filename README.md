# iphey — Digital Identity & Fingerprint Inspector

iphey is a TypeScript-first Cloudflare Worker API paired with a Next.js client that benchmarks how “real” a browser session looks. It combines IPbot intelligence with local fingerprint telemetry and renders an interactive trust dashboard.

## Stack

- **API**: Cloudflare Workers, Hono, TypeScript, Zod, KV-backed cache (single Worker — the whole API lives in `src/worker.ts`)
- **Clients**: IPbot as the primary IP intelligence provider, with ipinfo/Radar retained as optional fallback paths
- **Scoring**: deterministic heuristics for browser/location/IP/hardware/software panels
- **Frontend**: Next.js 16 (App Router) + React 19 (see `apps/web-next`), React Query for live scans, statically exported to Cloudflare Pages
- **Tooling**: Wrangler for local Worker dev/deploy, Vitest for unit coverage, npm scripts mirror AGENTS.md guidelines

## Project Layout

```
├─ src/                 # Worker entrypoint (worker.ts), clients, services, schemas, types, utils
├─ apps/web-next/       # Next.js front-end (production; static export)
├─ docs/                # Specs & configuration notes
├─ dist/                # Legacy tsc output (NOT the deploy artifact; Wrangler bundles src/worker.ts)
└─ .env.example         # Environment variable reference (no secrets committed)

Note: The mixvisit/ directory (if present) is an external Svelte library, NOT part of IPhey.
It's gitignored and not integrated into the build process.
```

## Getting Started

1. **Install dependencies**
   ```bash
   npm install
   bash -lc "cd apps/web-next && npm install --legacy-peer-deps"
   ```
2. **Configure environment**
   - For local `wrangler dev`, put `IPBOT_API_KEY` in `.dev.vars` (gitignored). Non-secret vars (origin, timeouts, TTLs) come from `wrangler.toml` `[vars]`.
   - `.env.example` documents every knob; copy it to `.env` only for tooling/scripts that read dotenv.
   - In production, set `IPBOT_API_KEY` with `wrangler secret put IPBOT_API_KEY` or the GitHub Actions secret of the same name.
   - Do **not** commit real tokens. Keep them in 1Password/local vaults per security guidance.
3. **Run the stack**

```bash
# start Worker API (Wrangler default port 8787)
npm run dev

 # optional: run the Next.js dev server with hot reload (port 3002 proxying /api)
 npm run web:dev
```

The Next.js client already lives in `apps/web-next`. Production traffic is served through Cloudflare Pages, with `NEXT_PUBLIC_API_URL` pointing at the Worker.

## Scripts

| Command                                                   | Description                                                                               |
| --------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `npm run dev`                                             | Wrangler dev server for the Worker API                                                    |
| `npm run web:dev`                                         | Next.js App Router dev server on port 3002                                                |
| `npm run build` / `npm run build:worker`                  | `tsc` type-check/compile to `dist/` (validation only; Wrangler bundles `src/worker.ts` at deploy) |
| `npm start`                                               | Alias for `wrangler dev`                                                                  |
| `npm run typecheck` / `npm run lint` / `npm run web:lint` | Type-check and lint API/frontend                                                          |
| `npm run test`                                            | Vitest suite with mocked upstream clients                                                 |
| `npm run coverage`                                        | Vitest with V8 coverage reports                                                           |
| `npm run health`                                          | Smoke check `/api/health` and `/api/v1/ip/1.1.1.1/enhanced` via `scripts/health-check.js` |

## API Surface

| Method                        | Route                                                                                                 | Description |
| ----------------------------- | ----------------------------------------------------------------------------------------------------- | ----------- |
| `GET /api/health`             | Build metadata + cache backend                                                                        |
| `GET /api/v1/services/status` | Provider readiness, including IPbot secret presence and Radar verification                            |
| `GET /api/v1/ip/:ip?`         | Normalized IP intelligence, cached by Worker KV                                                       |
| `POST /api/v1/report`         | Accepts browser fingerprint payloads (see `src/schemas/report.ts`) and returns panel scores + verdict |

All payloads are validated via Zod and errors bubble up through a typed ApiError helper.

## Production Deployment

Deploy both the API and frontend to Cloudflare (Workers + Pages). Key steps:

1. **Prepare credentials**
   - Copy `.deploy.env.example` to `.deploy.env` and fill in real values (Cloudflare Account/API token, KV, NEXT_PUBLIC_API_URL, etc.).
   - Use `wrangler secret put IPBOT_API_KEY` for the primary provider. Optional fallback/enrichment secrets are `IPINFO_TOKEN`, `CLOUDFLARE_RADAR_TOKEN`, and `ABUSEIPDB_API_KEY`.
   - Ensure KV `binding = "IP_CACHE"` in `wrangler.toml` matches the production namespace.
2. **Build frontend (Cloudflare Pages)**
   - Run `npm run web:build` (internally runs `npm run build --prefix apps/web-next`).
   - Deploy the static output at `apps/web-next/out`:
     ```bash
     CLOUDFLARE_ACCOUNT_ID=$CLOUDFLARE_ACCOUNT_ID \
     CLOUDFLARE_API_TOKEN=$CLOUDFLARE_API_TOKEN \
     npx wrangler pages deploy apps/web-next/out \
       --project-name="$CLOUDFLARE_PAGES_PROJECT"
     ```
3. **Build / deploy API (Cloudflare Workers)**
   - `npm run build:worker` runs TypeScript validation for the Worker.
   - `wrangler deploy` pushes `src/worker.ts` to Workers, binding KV + environment variables.
4. **Verification**
   - `curl "$PRODUCTION_API_URL/api/health"` and `curl -I "$PRODUCTION_WEB_URL"`.
   - Provider status is available at `curl "$PRODUCTION_API_URL/api/v1/services/status"`.

GitHub Actions runs `typecheck`, `lint`, API tests, and frontend lint before deploy. Pull requests run quality gates only; pushes to `main` deploy.

## API Examples

```bash
# Health check & upstream readiness
curl https://api.example.com/api/health

# Single IP lookup
curl https://api.example.com/api/v1/ip/8.8.8.8 | jq

# Enhanced IP + threat intel + ASN data
curl "https://api.example.com/api/v1/ip/1.1.1.1/enhanced?threats=true&asn=true" | jq '.risk_assessment'

# Fingerprint report (trimmed sample payload)
curl -X POST https://api.example.com/api/v1/report \
  -H 'Content-Type: application/json' \
  -d '{
        "fingerprint": {
          "userAgent": "Mozilla/5.0 ...",
          "languages": ["en-US","en"],
          "screen": {"width":1920,"height":1080},
          "hardwareConcurrency": 8,
          "cookiesEnabled": true
        }
      }'

```

All requests/responses are validated through Zod and errors are thrown via a unified `ApiError` helper, so curl example responses can be directly copied to CI or external monitoring scripts.

## Frontend UX

- Landing verdict hero with animated score dial and trust badge
- Five parity cards (Browser/Location/IP/Hardware/Software) linking to detailed signals
- Live “What websites see about you” grid reflecting the captured fingerprint
- CTA to the extended leak check + sponsor slot to mirror the reference design

The Next.js SPA uses React Query to run `collectFingerprint()` (WebGL, canvas, audio, fonts, timezone, etc.), sends it to `/api/v1/report`, and renders the normalized response.

## Testing & QA

- `vitest` covers scoring logic, IPbot client/retry behavior, Worker IP provider selection, and cache/deduplication behavior.
- When adding new Worker routes or clients, include fixtures under `src/**/__tests__` with mock resolvers so CI keeps the 80% target.
- Manual QA: `curl http://localhost:8787/api/health`, `curl -XPOST http://localhost:8787/api/v1/report -d '{"fingerprint":{...}}'`, plus visiting the Next.js dev server on http://localhost:3002.

## Troubleshooting

- **IP shows `127.0.0.1` locally**: Local Wrangler does not provide Cloudflare edge headers unless you send `X-Forwarded-For` in debug requests.
- **No IP data / placeholder results locally**: the Worker needs at least one provider configured — set `IPBOT_API_KEY` in `.dev.vars` (or `IPINFO_TOKEN`, or both `CLOUDFLARE_ACCOUNT_ID` + `CLOUDFLARE_RADAR_TOKEN`). With none set, lookups return a structured unavailable error. The v2 connection endpoint preserves an observed HTTP exit separately; it never fabricates location or risk.
- **`CLOUDFLARE_API_TOKEN required` deployment fails**: Ensure `source .deploy.env` before executing any `wrangler` commands. Token needs Workers KV + Pages permissions (same as creepjs).
- **`429` from upstream providers**: Disable or extend `CACHE_WARMING_*`. SWR cache will refresh in the background.
- **Frontend can't reach API**: Confirm Pages environment variable `NEXT_PUBLIC_API_URL` points to the Workers domain.
- **Pages builds successfully but shows blank screen**: Confirm `apps/web-next/out` was generated by `npm run web:build`.

## Security Notes

- Secrets must stay out of git; use `.deploy.env`, `wrangler secret`, or your CI’s secret store.
- Logs redact IPs before emitting and the service never persists raw fingerprints.
- IPbot API keys must only be provided through environment/secret stores; never in repo files.

For deeper roadmap items, see `docs/PROJECT_SPEC.md`. Contributions should follow Conventional Commits and request review from the IP platform team.


## Observation workspace

The main tasks are My check (`/`), IP lookup (`/ip`), Leak test (`/leaks`) and
Compare (`/compare`). ASN lookup is `/asn`. Seeded IP/ASN URLs retain the queried
object; arbitrary addresses use query parameters on the generic tools.

A scan starts after an explicit click. Browser measurements stay in memory until
the user saves locally or exports; connection metadata uses
`GET /api/v2/connection`. This version does not report population uniqueness or
a global safety score. DNS challenges and independent IPv4/IPv6 path probes are
explicitly not provided. Active WebRTC uses a disclosed STUN server, bounded ICE
gathering and connection cleanup.

The shared fingerprint type is `src/types/report.ts`; observations and versions
are in `src/types/scan.ts`, with external response validation in
`src/schemas/scan.ts`. Legacy report clients must supply complete observed hardware fields (nested or legacy flat) and provider risk evidence; incomplete evidence cannot be scored as
trustworthy. See `docs/ENDGAME.md` and `/api-reference` for compatibility details.

Checks: `npm run typecheck`, `npm run lint`, `npm run test`,
`npm run test --prefix apps/web-next`, `npm run web:lint`, and the managed OpenClaw
`npm run web:build` plus `scripts/browser-qa.mjs`. The browser regression uses
real browser probes and explicit API fixtures; it is not production-provider
validation.


## Security and record compatibility follow-up (2026-11-06)

The build/test toolchain supports Node 20.19+, 22.12+, or 24+ (CI uses 24).
The project `.npmrc` retains the legacy peer-resolution policy used by the
lockfiles; frontend installs keep the existing `--legacy-peer-deps` flag.
Hono, Zod, Next.js and Vitest were updated to patched versions within their
current production major versions. The frontend Vitest runner now shares the
root Vitest 4 series, replacing the affected 2.x runner.

Collector `2.0.1` keeps the basic browser observation separate from later
high-entropy probes. Earlier collector versions remain stored and are marked
incomparable. New record writes use shared validation and the same size limit
as reads. Legacy history can be inspected read-only; damaged legacy JSON does
not prevent current records from being used.

For repeatable HTTP integration on the registered OpenClaw preview:
`IPHEY_HTTP_INTEGRATION=1 node scripts/browser-qa.mjs`. This exercises the real
application Hono API over loopback HTTP, with synthetic provider responses and
reverse-proxy IP metadata. It does not contact production IP providers or test
Cloudflare's deployed runtime.
