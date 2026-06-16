# Cloudflare Release Runbook

This is the canonical deployment record for `iphey`. It documents the current production topology, where deployment tokens and secrets live, and the exact release path to use next time.

## Current Production Topology

- API runtime: Cloudflare Worker `iphey-api`
- API URL: `https://api.iphey.org`
- Frontend runtime: Cloudflare Pages project `iphey`
- Frontend custom domain: `iphey.org`
- Default release path: push to `main` -> GitHub Actions workflow `.github/workflows/deploy.yml`
- Manual fallback: `wrangler deploy` for Worker and `wrangler pages deploy` for Pages

The repository no longer has a production Node/Express runtime. Production is `Worker + Pages` only.

## Custom Domain Checklist

Use this when moving the project off the temporary `pages.dev` / `workers.dev` endpoints.

1. In Cloudflare Pages for project `iphey`, add the custom domain `iphey.org`.
2. Also add `www.iphey.org` and configure it to 301 redirect to the apex `iphey.org`.
3. In Cloudflare Workers for `iphey-api`, add the custom domain `api.iphey.org` or an equivalent route for `api.iphey.org/*`.
4. Update GitHub Actions secret `NEXT_PUBLIC_API_URL` to `https://api.iphey.org`.
5. Redeploy both Worker and Pages, then verify the production URLs below.

## Source Of Truth

- CI/CD workflow: [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml)
- Worker config: [`wrangler.toml`](../wrangler.toml)
- Alternate Worker config reference: [`wrangler-api.toml`](../wrangler-api.toml)
- Runtime config reference: [`docs/CONFIG.md`](./CONFIG.md)
- This runbook: [`docs/DIRECT_DEPLOY.md`](./DIRECT_DEPLOY.md)

## Secret Location Matrix

Record locations only. Never store real values in repo docs.

| Item                     | Where it lives                                                       | Used by                                                      | Notes                                                                                |
| ------------------------ | -------------------------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| `IPBOT_API_KEY`          | Local `./.dev.vars`; GitHub Actions secret; Cloudflare Worker secret | Local `wrangler dev`, CI deploy, production Worker runtime   | Primary IP provider secret. Required for production.                                 |
| `IPINFO_TOKEN`           | GitHub Actions secret; optional Cloudflare Worker secret             | Worker fallback provider                                     | Optional fallback. Do not add to tracked files.                                      |
| `CLOUDFLARE_RADAR_TOKEN` | GitHub Actions secret; optional Cloudflare Worker secret             | Worker fallback provider                                     | Optional fallback for Radar lookup.                                                  |
| `ABUSEIPDB_API_KEY`      | GitHub Actions secret; optional Cloudflare Worker secret             | Optional enrichment paths                                    | Not required for the main Worker IP path.                                            |
| `CLOUDFLARE_API_TOKEN`   | GitHub Actions secret; local shell env only when doing manual deploy | `cloudflare/wrangler-action`, manual `wrangler deploy`       | This is the deploy credential. Never write it into `.toml`, `.env.example`, or docs. |
| `CLOUDFLARE_ACCOUNT_ID`  | GitHub Actions secret; local shell env for manual deploy             | `cloudflare/wrangler-action`, manual `wrangler` auth context | Account-scoped deploy setting.                                                       |
| `NEXT_PUBLIC_API_URL`    | GitHub Actions secret                                                | Pages build step                                             | Frontend build-time config. Set to `https://api.iphey.org`.                          |
| KV namespace IDs         | `wrangler.toml`, `wrangler-api.toml`                                 | Worker runtime                                               | These are config identifiers, not secrets. Safe to keep in repo.                     |

## Secret Management Locations

### 1. Local Worker Development

Use `./.dev.vars` for local `wrangler dev` secrets. This file is gitignored and must stay local-only.

Expected use:

```bash
IPBOT_API_KEY=...
```

Do not put fallback provider tokens in repo files unless local testing actually needs them.

### 2. GitHub Actions

Primary deploy path uses repository Actions secrets.

Location:

`GitHub repo -> Settings -> Secrets and variables -> Actions`

Expected secret names:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `IPBOT_API_KEY`
- `IPINFO_TOKEN`
- `CLOUDFLARE_RADAR_TOKEN`
- `ABUSEIPDB_API_KEY`
- `NEXT_PUBLIC_API_URL` = `https://api.iphey.org`

These secrets drive both Worker deploy and Pages build/deploy in `.github/workflows/deploy.yml`.

### 3. Cloudflare Worker Runtime

When deploying manually without GitHub Actions, set Worker secrets directly with Wrangler:

```bash
wrangler secret put IPBOT_API_KEY
wrangler secret put IPINFO_TOKEN
wrangler secret put CLOUDFLARE_RADAR_TOKEN
wrangler secret put ABUSEIPDB_API_KEY
```

Use this path only as a fallback or for rotation outside CI.

## Preferred Release Flow

This is the normal path I should use in future sessions.

1. Confirm branch state and read `git status --short`.
2. Run quality gates:
   - `npm run typecheck`
   - `npm run test`
   - `npm run lint`
   - `npm run web:lint` when frontend changed
3. If runtime acceptance is needed, run `wrangler dev` on OpenClaw and smoke the Worker there.
4. Push to `main`.
5. Watch GitHub Actions `Deploy to Cloudflare`.
6. Smoke production URLs after the workflow finishes successfully.

This repo is configured so `push` to `main` is the authoritative deployment trigger.

## OpenClaw Acceptance Flow

Per workspace policy, runtime verification should happen on OpenClaw rather than the local control-plane Mac when a live Worker process is needed.

Recommended smoke commands:

```bash
curl -sS https://api.iphey.org/api/health
curl -sS https://api.iphey.org/api/ip/8.8.8.8
curl -sS https://api.iphey.org/api/v1/services/status
```

Expected signals:

- `/api/health` returns `200`
- `/api/ip/8.8.8.8` returns `200`
- payload contains `"source":"ipbot"` when IPbot is available

## Manual Fallback Deploy

Use this only if GitHub Actions is unavailable or a direct emergency deploy is required.

### Worker

```bash
npm ci
npm run build
wrangler deploy
```

### Pages

```bash
cd apps/web-next
npm ci --legacy-peer-deps
npm run build
cd ../../
wrangler pages deploy apps/web-next/out --project-name=iphey
```

Manual deploy requires a shell that already has:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

Do not rely on legacy notes that describe a Node backend or old `/api/v1/ip/:ip` as the primary route. The current primary lookup route is `/api/ip/:ip`.

## Post-Deploy Smoke Checklist

Run these after every production release:

```bash
curl -sS https://api.iphey.org/api/health
curl -sS https://api.iphey.org/api/ip/8.8.8.8
curl -I https://iphey.org
```

If frontend env changes were part of the release, also verify the deployed UI is calling the correct API origin.

## Token Rotation Checklist

When a deploy or provider token rotates:

1. Update the GitHub Actions secret.
2. If manual deploys are still used, update the operator's local shell env or secure vault.
3. If local `wrangler dev` needs the rotated value, update `./.dev.vars`.
4. Redeploy the Worker.
5. Re-run the production smoke checks.

Do not store rotated values in commit messages, docs, screenshots, shell history exports, or tracked config files.
