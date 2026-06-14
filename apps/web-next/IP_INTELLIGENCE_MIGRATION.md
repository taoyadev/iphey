# IP Intelligence Migration Notes

This document is historical. The old Vite/Express migration is complete and the production API is now a single Cloudflare Worker.

## Current Runtime

- **Frontend**: `apps/web-next`, Next.js App Router, local dev port `3002`, Cloudflare Pages in production.
- **API**: `src/worker.ts`, Hono on Cloudflare Workers, Wrangler local port `8787`.
- **Primary IP provider**: IPbot through `IPBOT_API_KEY`.
- **Fallback providers**: ipinfo and Cloudflare Radar when their secrets are configured.
- **Cache**: Cloudflare KV binding `IP_CACHE` in production.

## Current Endpoints

| Route                         | Purpose                              |
| ----------------------------- | ------------------------------------ |
| `GET /api/health`             | Worker health and cache metadata     |
| `GET /api/v1/services/status` | Provider readiness including IPbot   |
| `GET /api/v1/ip`              | Client IP lookup                     |
| `GET /api/v1/ip/:ip`          | Supplied IP lookup                   |
| `GET /api/v1/ip/enhanced`     | Client IP enriched response          |
| `GET /api/v1/ip/:ip/enhanced` | Supplied IP enriched response        |
| `POST /api/v1/report`         | Fingerprint report and panel scoring |

## Local Smoke

```bash
npm run dev
curl http://localhost:8787/api/health
curl http://localhost:8787/api/v1/services/status
curl http://localhost:8787/api/v1/ip/8.8.8.8
```

The old `localhost:4310`, `src/routes/**`, and Express references no longer apply.
