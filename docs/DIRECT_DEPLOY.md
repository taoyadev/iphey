# Cloudflare Direct Deploy Guide

This document mirrors the creepjs direct-deploy workflow and shows how to publish **both** the iphey API (Workers) and the Next.js front-end (Pages) straight from your workstation—no GitHub Actions required. For a 1:1 reference, compare with `/Volumes/SSD/dev/new/ip-dataset/creepjs/DIRECT_DEPLOY.md` and `.deploy.env` — the commands and required tokens are intentionally named the same.

## 1. Prerequisites

- `wrangler` ≥ 3.78 installed globally (`npm install -g wrangler`).
- Cloudflare account with Pages + Workers + KV permissions.
- Optional GitHub Personal Access Token if you want to push release tags automatically.

## 2. `.deploy.env` (local secrets vault)

Copy the template to a real secret file:

```bash
cp .deploy.env.example .deploy.env
```

Then edit `.deploy.env` with your credentials (the template is ignored by git, so the real file stays local). Keep real values in your copy only—**never** commit this file.

```bash
# Cloudflare
CLOUDFLARE_API_TOKEN=cf-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
CLOUDFLARE_ACCOUNT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
CLOUDFLARE_PAGES_PROJECT=iphey-web
CLOUDFLARE_WORKER_NAME=iphey-api

# Workers KV (optional but recommended)
KV_IP_CACHE=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Upstream secrets that will be written via `wrangler secret`
IPINFO_TOKEN=
CLOUDFLARE_RADAR_TOKEN=

# GitHub release automation (optional)
GITHUB_TOKEN=
GITHUB_REPO=taoyadev/iphey

# Production URLs (documentation only)
PRODUCTION_WEB_URL=https://iphey.example.com
PRODUCTION_API_URL=https://api.iphey.example.com
```

Load it with `source .deploy.env` (or use `direnv`). The deploy scripts assume these env vars exist.

## 3. Build & Deploy – Quick Commands

From `/Volumes/SSD/dev/new/ip-dataset/iphey`:

```bash
# Backend Worker
npm install
npm run build:worker
wrangler deploy \
  --name="$CLOUDFLARE_WORKER_NAME" \
  --env production

# Frontend (Next.js on Pages)
cd apps/web-next
npm install
npm run build
cd ../../
CLOUDFLARE_ACCOUNT_ID=$CLOUDFLARE_ACCOUNT_ID \
  CLOUDFLARE_API_TOKEN=$CLOUDFLARE_API_TOKEN \
  npx wrangler pages deploy .vercel/output/static \
  --project-name="$CLOUDFLARE_PAGES_PROJECT"
```

For Pages, the build step automatically emits `.vercel/output/static` via the Next-on-Pages adapter configured in `apps/web-next`. If you prefer the stock adapter, run `npx @cloudflare/next-on-pages` after `npm run build` and deploy the generated output folder.

## 4. Worker Secrets & KV Bindings

```bash
# One-time KV binding (match wrangler.toml bindings)
wrangler kv:namespace create IP_CACHE
wrangler kv:namespace create IP_CACHE --preview

# Secrets (each command will prompt for the value)
wrangler secret put IPINFO_TOKEN
wrangler secret put CLOUDFLARE_ACCOUNT_ID
wrangler secret put CLOUDFLARE_RADAR_TOKEN
```

Double-check `wrangler.toml` to ensure the namespace IDs and bindings align with your Cloudflare account.

## 5. Optional Automation Script

The repo ships with `scripts/deploy-cloudflare.sh`. After populating `.deploy.env` you can run:

```bash
./scripts/deploy-cloudflare.sh   # interactive walkthrough
```

It validates Wrangler login, runs `npm run build:worker`, and deploys the Worker. Extend it with the Pages commands above if you need a single button press.

## 6. Verification Checklist

```bash
# Worker health
curl "$PRODUCTION_API_URL/api/health"

# Radar token check is included in the health payload

# Pages preview (replace route as needed)
curl -I "$PRODUCTION_WEB_URL"
```

Back in the Cloudflare dashboard, confirm:

- Worker route is bound to `api.iphey.example.com/*` (or your chosen domain).
- Pages project has the custom domain attached and the `NEXT_PUBLIC_API_URL` environment variable set to the Worker hostname.

## 7. 故障排查 (Common Issues)

| Error | Fix |
| --- | --- |
| `Error: In a non-interactive environment... set a CLOUDFLARE_API_TOKEN` | Export `CLOUDFLARE_API_TOKEN` (from `.deploy.env`) before running `wrangler` |
| `Request failed: 403` during KV operations | Ensure the API token has “Account > Workers KV Storage: Edit” permission |
| Next.js deploy serves blank page | Make sure you ran `npm run web:build` inside `apps/web-next` or `npx @cloudflare/next-on-pages` before deploying `.vercel/output/static` |
| Frontend showing `::1` for IP | The Worker still sees the Pages origin; add `cf-connecting-ip` to the request when testing locally |

## 8. API 示例 (Post-Deploy Smoke Tests)

After both Workers and Pages go live, run these quick curls (same as the README examples) to prove the surface behaves like the creepjs deployment:

```bash
# Health check & upstream readiness
curl "$PRODUCTION_API_URL/api/health"

# Single IP lookup with normalized payload
curl "$PRODUCTION_API_URL/api/v1/ip/8.8.8.8" | jq

# Fingerprint scoring (trimmed payload)
curl -X POST "$PRODUCTION_API_URL/api/v1/report" \
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

Successful responses confirm Workers secrets are wired, KV caching is available, and the Pages client can safely point `NEXT_PUBLIC_API_URL` to the Worker hostname.

For a deeper dive (build order, CDN cache purge, historical log), see `CLOUDFLARE_DEPLOYMENT.md` and `docs/PROJECT_SPEC.md`.
