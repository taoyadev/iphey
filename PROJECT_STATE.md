# Project State

Last audited: 2026-06-16

## Deploy topology

- Frontend runtime: Cloudflare Pages project `iphey`
- Frontend custom domain: `https://iphey.org`
- Frontend fallback domain: `https://42356dc5.iphey-657.pages.dev`
- API runtime: Cloudflare Worker `iphey-api`
- API fallback domain: `https://iphey-api.difft.workers.dev`
- Expected API custom domain: `https://api.iphey.org`
- Preferred release path: push to `main` -> GitHub Actions workflow [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml)

## Current verified state

- `https://iphey.org` returned HTTP 200 on 2026-06-16.
- `https://42356dc5.iphey-657.pages.dev` returned HTTP 200 on 2026-06-16.
- `https://iphey-api.difft.workers.dev/api/health` returned a healthy JSON payload on 2026-06-16.
- `https://api.iphey.org` did not complete a TLS handshake from the control-plane Mac on 2026-06-16.
- The latest five GitHub Actions runs for `Deploy to Cloudflare` on `main` were successful as of 2026-06-16.
- The frontend code now prefers `https://api.iphey.org` but falls back to `https://iphey-api.difft.workers.dev` for runtime fetch failures in production.

## Current release blockers

1. Local direct Wrangler deploy is blocked because the project-local Cloudflare token currently fails `wrangler whoami` with `Invalid access token [code: 9109]`.
2. GitHub push deploy is blocked from this shell because `git push origin main` returned `403 Permission to taoyadev/iphey.git denied to newbie-learn-coding`.
3. `https://api.iphey.org` is still unhealthy from this environment, so the roadmap's preferred custom-domain API path is not complete even though the frontend now has a workers.dev fallback.
4. Public `https://iphey.org/docs`, `/api-reference`, and `/leaks` still serve the old root title/canonical, so the latest route metadata changes are not live yet.

## Latest local validation

The current worktree passed:

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run web:lint`
- `npm run web:build`

The latest local `next build` output now emits unique title/description/canonical values for:

- `/docs`
- `/api-reference`
- `/leaks`

## Next actions

1. Refresh the Cloudflare deploy credential used for local manual deploys, or keep using GitHub Actions as the only release path.
2. Use a GitHub identity with push access to `taoyadev/iphey`, or merge/cherry-pick commit `b819149` through a collaborator-controlled path.
3. Fix the Cloudflare Worker custom domain or route for `api.iphey.org`.
4. After the commit is published, verify the live routes in a real browser.
