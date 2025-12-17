# Repository Guidelines

Short, actionable notes for contributing to the iphey project.

## Project Structure & Module Organization
- `src/` – Express API + Worker entrypoints (`server.ts`, `worker.ts`), routes, middleware, schemas, services, and tests under `__tests__` / `test/`.
- `apps/web-next/` – Next.js 14 App Router UI with its own `package.json`; runs independently in dev.
- `docs/` – deployment/config guides; check before changing Cloudflare settings.
- `scripts/` – helper scripts referenced by docs; keep them idempotent.
- `dist/` – build output (leave untouched). `mixvisit/` is an external library and excluded from builds.

## Build, Test, and Development Commands
- Install: `npm install` (root) then `npm install --prefix apps/web-next` for the UI.
- API dev: `npm run dev` (port 4310, hot reload).
- Frontend dev: `npm run web:dev` (port 3002, proxies `/api`).
- Build: `npm run build` (Next.js build + `tsc` to `dist/`); `npm start` runs compiled API.
- Cloudflare: `npm run worker:dev` locally; `npm run worker:deploy` to Workers.
- Quality: `npm run lint`, `npm run web:lint`, `npm run typecheck`, `npm run format` / `format:check`.
- Tests: `npm run test` or `test:watch`; `npm run coverage` for V8 reports.

## Coding Style & Naming Conventions
- Prettier (`2` spaces, single quotes, semicolons, width 120, LF) + ESLint (`no-unused-vars` ignores `_` args, avoid `any`).
- File names: lower-kebab (`routes/ip.ts`), types/interfaces `PascalCase`, values/functions `camelCase`.
- Keep side effects in `services/` or `clients/`; `routes/` stay thin; reusable helpers live in `utils/`.
- Husky + lint-staged run eslint/prettier on TS/TSX and prettier on JSON/MD before commits.

## Testing Guidelines
- Vitest + Supertest (`vitest.config.ts` targets `src/**/*.test.ts` and sets env vars); shared setup in `src/test/setup.ts`.
- Name tests `*.test.ts` near code or in `__tests__/`; mock upstream IP clients, avoid real network calls.
- Aim for ~80% coverage; add fixtures with new routes/services and run `npm run coverage` before PRs.

## Commit & Pull Request Guidelines
- Use Conventional Commits (`feat:`, `fix:`, `chore:`…). Keep scopes short.
- Before PRs: run `npm run lint`, `npm run test`, `npm run web:lint` when UI is touched, and update docs for schema/config changes.
- PRs should link issues, summarize behavior changes, note test commands run, and attach screenshots for UI updates.

## Security & Configuration Tips
- Node `>=18.18.0` required. Never commit secrets; copy `.env.example` / `.deploy.env.example` and use `wrangler secret put` for production tokens.
- CORS origins, cache TTLs, and rate limits are env-driven (`src/config.ts`); document new knobs in `docs/CONFIG.md`.
