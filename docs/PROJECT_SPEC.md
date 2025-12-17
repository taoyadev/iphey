# IPhey Browser Fingerprint Intelligence — Project Spec (Draft v1 · 2025-11-13)


## Needs
- ipinfo.io Batch API access token (`IPINFO_TOKEN`) stored in your `.env`/secrets manager.
- GitHub API access for automation (generate a personal access token and keep it outside the repo).
- Cloudflare Radar account ID + API token for `/tokens/verify` (configure via `CLOUDFLARE_ACCOUNT_ID`/`CLOUDFLARE_RADAR_TOKEN`).



## 1. Vision & Success Criteria
- Provide a one-stop "digital identity" report that blends IP reputation, location fidelity, and browser fingerprint consistency, surpassing the reference UI shared by the user.
- Empower analysts and privacy-conscious users to validate their setup in <3 seconds with clear scoring, remediation hints, and exportable artifacts.
- Success signals: <400 ms cold API latency for `/v1/report`, 99% uptime, and user feedback that the UI feels more trustworthy and responsive than the reference site.

## 2. Goals / Non-Goals
| Goals | Non-Goals |
| --- | --- |
| Ship a typed Express (Node 18+) API with clear `routes/`, `clients/`, `middleware/`, `utils/`, `types/` folders per AGENTS.md | Building a separate mobile app |
| Mirror the fingerprint panels (Browser, Location, IP, Hardware, Software) with improved accessibility, skeleton loaders, and dark-mode ready tokens | Re-implementing low-level fingerprinting logic from scratch — we will reuse `creepjs` where practical |
| Integrate IP data via ipinfo.io (primary) with Cloudflare Radar (fallback) and gracefully handle quota exhaustion | Running arbitrary third-party scanners or storing historical user data |
| Enforce env validation via `src/config.ts`, lean logging with PII redaction, and never commit secrets | Building an on-prem deployment installer in this phase |

## 3. Personas & Core Use Cases
- **Fraud Ops Analyst**: needs to vet proxy pools quickly before running automation.
- **Privacy Enthusiast**: validates that their spoofed fingerprint truly mimics residential traffic.
- **QA Engineer**: regression-tests browser/extension combos and exports before/after diffs.

Use cases include: single-click "Check my identity" report, detailed breakdown tabs, downloadable JSON snapshot, and guidance when mismatches are detected (e.g., timezone vs. IP location).

## 4. Product Surface Outline
1. **Landing Panel** — hero verdict (Trustworthy/Suspicious/Unreliable) + CTA to rerun checks.
2. **Five Insight Cards** — Browser, Location, IP Address, Hardware, Software (click/scroll targets).
3. **Detail Tabs** — replicating reference layout but with modern tokens (CSS variables, `prefers-reduced-motion`), skeleton loaders, and copy-to-clipboard icons reused from `creepjs` assets.
4. **Extended Checks** — link to `/leaks` (to be backed by our API), plus shareable permalink.

## 5. System Architecture
- **Frontend**: Vite + TypeScript + Vanilla Extract (or Tailwind) SPA, hosted from `frontend/` and built into `/dist/public`. It consumes our API via `fetch`.
- **Backend**: Single Express app (Node 18). Entry point `src/server.ts`; environment handling in `src/config.ts`; routers under `src/routes/**`; Zod schemas under `src/schemas/`.
- **External Clients**:
  - `src/clients/ipinfo.ts` — hits `https://ipinfo.io/batch` with configurable token; caches responses per IP for 5 minutes.
  - `src/clients/cloudflareRadar.ts` — fallback using Radar IP intelligence (auth via bearer token); implements same DTO as ipinfo client.
  - `src/clients/creepjs.ts` — wraps the `/Volumes/SSD/dev/new/ip-dataset/creepjs` assets (to be vendored / symlinked) to evaluate browser fingerprint entropy on the client, sending only summarized scores back to the API.
- **Data Flow**: client collects browser metrics via `creepjs`, posts to `/v1/report`. Server hydrates IP intelligence (ipinfo primary, Radar fallback on 4xx/5xx) and enriches with heuristics before responding.

## 6. API Surface (initial)
| Route | Method | Description |
| --- | --- | --- |
| `/health` | GET | build/version + upstream dependency check |
| `/v1/report` | POST | Accepts browser fingerprint payload (UA, WebGL, Canvas, timezone, fonts) + optional IP override; responds with verdict tiers and panel data |
| `/v1/ip/:ip` | GET | Single IP lookup (uses cache) mainly for CLI/debug |
| `/v1/leaks` | POST | (Phase 2) Proxy to my-ip-data for leak tests |

All payloads flow through Zod schemas stored in `src/schemas/report.ts` etc., ensuring shape parity between clients and routers.

## 7. Data Modeling & Scoring
- **Score Categories**: Browser authenticity, Location coherence, IP reputation, Hardware consistency, Software hygiene.
- Each category emits `status` (`trustworthy | suspicious | unreliable`), `score` (0–100), `signals` (array of bullet strings), plus `remediation` tip.
- Global verdict is derived via weighted average (Browser + IP weigh 30% each, others 13.3% each).

## 8. External Integrations & Secrets
- `IPINFO_TOKEN` — stored in `.env`, validated by `src/config.ts`. Never hard-code (the sample token provided by the requester must stay local).
- `CLOUDFLARE_RADAR_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` — also env-driven; use Cloudflare `/client/v4/accounts/{id}/tokens/verify` for startup health-check only.
- GitHub token (taoyadev) is **not** persisted; if automation needs GitHub data later, add a scoped env var and document in `docs/CONFIG.md`.
- Config file enumerates required vars, sensible defaults (e.g., `PORT=4310`), and enforces runtime failures when unset.

## 9. Security, Privacy, Compliance
- Never persist raw IPs/fingerprints; only return aggregates to the requesting session.
- Apply PII-safe logging: redact IP in logs via `logger.info({ ipHash }, 'ip lookup')` (sha256 truncated).
- Enable rate limiting + basic token bucket to prevent abuse when self-hosted.
- Serve frontend with strict CSP, disable inline scripts (bundle everything), and include `prefetch` hints for heavy assets just like the reference HTML.

## 10. Tooling & Quality Gates
- `npm run dev` / `build` / `start` / `lint` exactly as defined in AGENTS.md.
- Testing via Vitest + Supertest (`src/**/__tests__`). Aim for 80% line coverage on `routes` + `clients`; add coverage comments to `docs/coverage.md` once tests ship.
- Mock ipinfo/radar in tests via fixtures under `src/clients/__mocks__/`.

## 11. Implementation Milestones
1. **Scaffolding (Day 0-1)**: Init package, tsconfig, lint config, base Express skeleton, env validation, `/health` route.
2. **IP Intelligence (Day 1-2)**: Clients for ipinfo + Radar, caching, `/v1/ip` + `/v1/report` basic IP enrichment, unit tests.
3. **Fingerprint Ingestion (Day 2-3)**: Integrate `creepjs` front-end assets, define schema for browser data, scoring heuristics, UI wiring for Browser/IP cards.
4. **Full UI Polish (Day 3-4)**: Remaining panels, skeleton loading states, shareable permalink, extended leaks link stub.
5. **Hardening (Day 4+)**: Observability, docs (`docs/ROADMAP.md`, `docs/CONFIG.md`), deployment scripts.

## 12. Open Questions
- Confirm availability of `/Volumes/SSD/dev/new/ip-dataset/creepjs`; if absent, import directly from upstream repo.
- Clarify whether `/leaks` should proxy to an existing upstream or run local heuristics.
- Decide on hosting (Vercel? Fly?). For now we assume container-based deploy with build artifact under `dist/`.

_Prepared by Codex assistant — pending user feedback before locking scope._
