# iphey — Digital Identity & Fingerprint Inspector

iphey is a TypeScript-first Express API paired with a Next.js 14 client that benchmarks how “real” a browser session looks. It combines IP intelligence (ipinfo + Cloudflare Radar) with local fingerprint telemetry and renders an interactive dashboard inspired by the reference UI you shared.

## Stack
- **API**: Express 5, TypeScript, Zod, Pino, LRU cache, undici
- **Clients**: ipinfo batch + Cloudflare Radar with automatic failover and per-IP caching
- **Scoring**: deterministic heuristics for browser/location/IP/hardware/software panels
- **Frontend**: Next.js 14 + App Router (see `apps/web-next`), React Query for live scans, deployed to Cloudflare Pages
- **Tooling**: ts-node-dev for local dev, Vitest + Supertest for unit coverage, npm scripts mirror AGENTS.md guidelines

## Project Layout
```
├─ src/                 # Express app, routes, clients, middleware
├─ apps/web-next/       # Next.js 14 front-end (production)
├─ docs/                # Specs & configuration notes
├─ dist/                # Compiled server + bundled frontend (via `npm run build`)
└─ .env.example         # Required environment variables (no secrets committed)

Note: The mixvisit/ directory (if present) is an external Svelte library, NOT part of IPhey.
It's gitignored and not integrated into the build process.
```

## Getting Started
1. **Install dependencies**
   ```bash
   npm install
   bash -lc "cd apps/web-next && npm install"
   ```
2. **Configure environment**
   - Copy `.env.example` → `.env` and fill at least `IPINFO_TOKEN` **or** both `CLOUDFLARE_ACCOUNT_ID` + `CLOUDFLARE_RADAR_TOKEN`.
   - Do **not** commit real tokens. Keep them in 1Password/local vaults per security guidance.
3. **Run the stack**
  ```bash
  # start API (port 4310)
  npm run dev

   # optional: run the Next.js dev server with hot reload (port 3002 proxying /api)
   npm run web:dev
  ```
  The Next.js client already lives in `apps/web-next`. During local work it runs independently on port 3002 and proxies `/api` calls back to the Express server. Production traffic is served through Cloudflare Pages.

## Scripts
| Command | Description |
| --- | --- |
| `npm run dev` | ts-node-dev hot reload of the API |
| `npm run web:dev` | Next.js App Router dev server on port 3002 |
| `npm run build` | Builds the Next.js client (`apps/web-next`) then compiles the API/Worker via `tsc` |
| `npm start` | Runs the compiled API from `dist/` |
| `npm run lint` / `npm run web:lint` | Type-check API / frontend |
| `npm run test` | Vitest suite (mocks ipinfo/radar clients) |
| `npm run coverage` | Vitest with V8 coverage reports |
| `npm run health` | Smoke check `/api/health` and `/api/v1/ip/1.1.1.1/enhanced` via `scripts/health-check.js` |

## API Surface
| Method | Route | Description |
| --- | --- | --- |
| `GET /api/health` | Build metadata + upstream readiness (ipinfo token presence, Radar verification) |
| `GET /api/v1/ip/:ip?` | Normalized IP intelligence (cached, uses fallback) |
| `POST /api/v1/report` | Accepts browser fingerprint payloads (see `src/schemas/report.ts`) and returns panel scores + verdict |

All payloads are validated via Zod and errors bubble up through a typed ApiError helper.

## Production Deployment

Following the `creepjs` project's `DIRECT_DEPLOY.md` / `.deploy.env` approach, deploy both the API and frontend to Cloudflare (Workers + Pages). Key steps:

1. **Prepare credentials**
   - Copy `.deploy.env.example` to `.deploy.env` and fill in real values (Cloudflare Account/API token, KV, NEXT_PUBLIC_API_URL, etc.).
   - Use `wrangler secret put` to write `IPINFO_TOKEN`, `CLOUDFLARE_RADAR_TOKEN`, and other secrets. Ensure KV `binding` in `wrangler.toml` matches the production Namespace.
2. **Build frontend (Cloudflare Pages)**
   - Run `npm run web:build` (internally runs `npm run build --prefix apps/web-next`).
   - Deploy the Next on Pages output at `.vercel/output/static`:
     ```bash
     CLOUDFLARE_ACCOUNT_ID=$CLOUDFLARE_ACCOUNT_ID \
     CLOUDFLARE_API_TOKEN=$CLOUDFLARE_API_TOKEN \
     npx wrangler pages deploy .vercel/output/static \
       --project-name="$CLOUDFLARE_PAGES_PROJECT"
     ```
3. **Build / deploy API (Cloudflare Workers)**
   - `npm run build:worker` sequentially runs Next.js build + `tsc`, generating `dist/worker.js`.
   - `wrangler deploy --name "$CLOUDFLARE_WORKER_NAME" --env production` pushes to Workers, binding KV + environment variables.
4. **Verification**
   - `curl "$PRODUCTION_API_URL/api/health"` and `curl -I "$PRODUCTION_WEB_URL"`.
   - Cloudflare Radar / ipinfo token validity is included in the `/api/health` response for easy verification.

For more detailed operations (KV initialization, Pages diff, GitHub release), see `docs/DIRECT_DEPLOY.md`, which mirrors `/Volumes/SSD/dev/new/ip-dataset/creepjs/DIRECT_DEPLOY.md` for easy command copying between repositories.

If you prefer container-based hosting for the Express server, run `npm run build` and deploy `dist/server.js` to your platform of choice, then point the front-end’s `NEXT_PUBLIC_API_URL` to that hostname.

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

# Threat intel only
curl https://api.example.com/api/v1/ip/8.8.8.8/threats | jq '.combined'
```

All requests/responses are validated through Zod and errors are thrown via a unified `ApiError` helper, so curl example responses can be directly copied to CI or external monitoring scripts.

## Frontend UX
- Landing verdict hero with animated score dial and trust badge
- Five parity cards (Browser/Location/IP/Hardware/Software) linking to detailed signals
- Live “What websites see about you” grid reflecting the captured fingerprint
- CTA to the extended leak check + sponsor slot to mirror the reference design

The Next.js SPA uses React Query to run `collectFingerprint()` (WebGL, canvas, audio, fonts, timezone, etc.), sends it to `/api/v1/report`, and renders the normalized response.

## Testing & QA
- `vitest` covers scoring logic (`reportService`) and IP client failover paths (`ipService`).
- When adding new routers or clients, include fixtures under `src/**/__tests__` with mock resolvers so CI keeps the 80% target.
- Manual QA: `curl http://localhost:4310/api/health`, `curl -XPOST http://localhost:4310/api/v1/report -d '{"fingerprint":{...}}'`, plus visiting the Next.js dev server on http://localhost:3002.

## Troubleshooting

- **IP shows `::1` locally**: Local Express doesn't have reverse proxy enabled, Cloudflare headers unavailable. Deploy to Workers or set `TRUST_PROXY=loopback` and include `X-Forwarded-For` in debug requests.
- **`Invalid environment configuration` on boot**: `.env` requires at least `IPINFO_TOKEN` or both `CLOUDFLARE_ACCOUNT_ID` + `CLOUDFLARE_RADAR_TOKEN`. When missing, `src/config.ts` throws a Zod error.
- **`CLOUDFLARE_API_TOKEN required` deployment fails**: Ensure `source .deploy.env` before executing any `wrangler` commands. Token needs Workers KV + Pages permissions (same as creepjs).
- **`429` from upstream providers**: Disable or extend `CACHE_WARMING_*`. SWR cache will refresh in the background.
- **Frontend can't reach API**: Confirm Pages environment variable `NEXT_PUBLIC_API_URL` points to the Workers domain, and add Pages domain to `CORS_ALLOWED_ORIGINS`.
- **Pages builds successfully but shows blank screen**: Check if `.vercel/output/static` is generated by Next on Pages. If needed, run `npx @cloudflare/next-on-pages` then `wrangler pages deploy`. This workflow is consistent with creepjs/Web.

## Security Notes
- Secrets must stay out of git; use `.deploy.env`, `wrangler secret`, or your CI’s secret store.
- Logs redact IPs before emitting and the service never persists raw fingerprints.
- Rate limiting (60 req/min) is enabled per spec.

For deeper roadmap items, see `docs/PROJECT_SPEC.md`. Contributions should follow Conventional Commits and request review from the IP platform team.
