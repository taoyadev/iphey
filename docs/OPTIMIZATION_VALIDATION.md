# IPhey optimization implementation and validation

Date: 2026-11-06. Base HEAD: `9d79f33db5a33e68eeb75885168fba085a6a8da5`.
This is a working-tree implementation, not a production deployment. Existing
uncommitted work was retained; no commit, push, provider-key provisioning or
production write was performed.

## Implemented packages

| Package | Delivered behavior |
| --- | --- |
| IPHEY-01 | One-action check; shared collector payload; nested fields survive Zod validation; independent failed probes; no fabricated geography or missing-risk defaults; no population uniqueness statistics in the new workspace. |
| IPHEY-02 | Four task entries, three effective presets, first-viewport controls/status, native keyboard controls, evidence/source/time/limitation details, cancellation, separate retries and retained previous measurements. Theme RGB/HSL collision and muted-text contrast corrected. |
| IPHEY-03 | Generic IPv4/IPv6 and strict ASN tools; local special-use classification; all 20 IP and 6 ASN detail URLs retain their objects; provider identity validation, instance deduplication, bounded requests, real cache times and explicit stale refresh failure. |
| IPHEY-04 | Shared Canvas, WebGL, silent Audio, bounded 24-candidate font and WebRTC probes. Canvas sample is visible; font measurement does not claim an OS inventory. WebRTC gathers actual ICE candidates, normalizes addresses, distinguishes candidate types and closes on completion/cancellation/deadline. DNS and independent IPv4/IPv6 path capabilities remain explicitly not provided. |
| IPHEY-05 | Versioned local records, naming, deletion, complete related-history clearing, redacted export and selected-field technical export. Comparison checks version/scope/source and distinguishes changed, unchanged, missing and incomparable. Legacy records are preserved and identified as incompatible. Advanced monitoring is serial, pauses in the background and cancels on stop. |
| IPHEY-06 | Help, API and privacy pages; task-based guide content; three dated, sourced task comparisons; 404 query recovery; optional evidence-scoped explanation with disclosed minimized context, bounded input, cancellation, streaming reassembly and labeled reference fallback. Removed the incompatible static Next.js POST implementation. |

## Main implementation locations

- `apps/web-next/components/check/`: check, query, compare, monitor and optional explanation workspaces.
- `apps/web-next/lib/fingerprint.ts`, `scan.ts`, `records.ts`, `webrtc.ts`, `sse.ts`: probes, scan ownership, local records and streaming.
- `src/types/scan.ts`, `src/types/report.ts`, `src/schemas/`: shared contracts and external input/output validation.
- `src/services/ipService.worker.ts`, `ipNormalization.ts`, `ipbotService.ts`, `src/utils/requestDeduplication.ts`: provider truth, budgets and cache concurrency.
- `src/worker.ts`: v2 connection endpoint, legacy compatibility, bounded bodies/instance quotas, errors, status and optional AI.
- `apps/web-next/app/`, `content/guides/`, `components/Layout/`, `app/globals.css`: task routes, retained detail URLs, content and visual/accessibility fixes.
- `scripts/preview.mjs`, `scripts/browser-qa.mjs`: managed static preview and repeatable acceptance.
- `docs/ENDGAME.md`, `docs/CONFIG.md`, `docs/ROADMAP.md`, `README.md`: confirmed target and corrected operational contracts.
- `~/.codex/config/openclaw-projects.json`: added the isolated `iphey-optimization` preview registration (port band 4390–4399). Runtime validation chain passed.

## Initial implementation checks and receipts

| Check | Result |
| --- | --- |
| `npm run typecheck` | Passed. |
| `npm run lint` | Passed. |
| `npm run test` | 31 tests passed in 6 files. |
| `npm run test --prefix apps/web-next` | 9 tests passed in 3 files. |
| `npm run web:lint` | Passed. |
| `npm run web:build` on OpenClaw | Passed; latest successful receipt `20261106T100137Z`. |
| `oc e2e --project iphey-optimization` | 122 assertions passed, latest artifact run `20261106-100324`. |
| `validate-required-chain.sh --profile runtime` | Passed, zero errors/warnings in its final summary. |
| `git diff --check` | Passed at closeout. |

Full project-check receipt before the final two UI-only adjustments:
`~/.codex/state/openclaw-test/iphey-optimization/20261106T095629Z-receipt.json`.
The subsequent build and browser checks include the corrected embedded heading
and the server-rendered leak workspace.

Final browser artifacts:
`/Users/openclaw/artifacts/iphey-optimization/20261106-100324/`.
Selected local copies:
`output/playwright/2026-11-06/` (ignored generated artifacts).

Browser acceptance covers all 49 sitemap routes at mobile width: HTTP success,
one primary heading and no horizontal overflow. It also covers first render
without JavaScript, no automatic API queries on navigation, one-click launch,
real Canvas output accepted by the backend schema, saved baseline/current
comparison, IPv6/private queries, seeded URL refresh, failed leak checks,
cancellation, storage quota failure, actual WebRTC connection cleanup, monitor
controls, keyboard activation, 404 status and core-workspace automated WCAG
checks. Desktop and phone screenshots were inspected after image safety preflight.

Provider responses are explicit browser fixtures. Browser probes (including the
WebRTC lifecycle) run in a real isolated OpenClaw Chromium session. These are not
live provider, production routing, VPN leak-free, or global accuracy proofs.

## Failure handling and limitations

- An old cache fixture queried one IP but returned another; it was corrected
  after the new provider-object validation rejected it.
- The browser harness initially concatenated a trailing preview slash; URL
  normalization and an explicit two-record assertion corrected the harness.
- All-route checks found and fixed a second h1 in the embedded compare workspace
  and the old client-only loading layer on `/leaks`.
- A new negative test found body-limit exceptions being converted into 500 by
  route error handling; bounded JSON parsing now preserves 413.
- Two OpenClaw wrapper runs failed in post-build cleanup at
  `openclaw-resource-guard` → `os.killpg` with
  `PermissionError: [Errno 1] Operation not permitted`. Their logs showed completed
  builds, but those receipts are not counted as passes. Later direct build and
  E2E receipts completed successfully. No unrelated runtime repair was made.
- The initial root dependency install reported 18 audit findings (4 moderate,
  12 high, 2 critical). Applicability was not assessed and dependency upgrades
  were not made in this task.
- The existing dependency data emits old Browserslist/baseline-mapping warnings.
  Dependency upgrades and the pre-existing lockfile changes were not folded into
  this feature task.
- No live IP-provider/AI credential canary, production deployment, or real-user
  P75 Core Web Vitals measurement was performed. DNS authority/challenge storage
  and independent dual-stack infrastructure were intentionally not provisioned.
- The public quota is bounded per Worker app instance, not a global distributed
  quota. KV deduplication is not claimed to be a global lock.
- Legacy scoring API fields remain compatibility heuristics, not calibrated
  population statistics. New observations do not use a trust score.


## Continuation: dependency security, record integrity and real HTTP integration

Continued on 2026-11-06 without publishing or changing credentials.

### Security dependency changes

- Hono `4.13.16`; Zod `4.6.7`; root Vitest and coverage `4.1.12`.
- Next.js, its ESLint configuration and MDX integration `16.4.5`.
- Frontend Vitest moved from `2.1.9` to `4.1.12`; glob and tsx received
  compatible-major updates. Remaining lockfile updates stay inside declared ranges.
- Root `.npmrc` makes peer-resolution policy consistent with the generated locks.
  Standard root `npm ci` was verified with this configuration. UI clean install
  retains its documented `--legacy-peer-deps` flag. Node support is now declared
  as `^20.19.0 || ^22.12.0 || >=24.0.0`; verification used Node 22.19.0.

The Hono change includes the patched
[body-limit boundary](https://github.com/honojs/hono/security/advisories/GHSA-9vqf-7f2p-gf9v).
The affected Vitest runner was covered by its
[upstream UI-server advisory](https://github.com/vitest-dev/vitest/security/advisories/GHSA-5xrq-8626-4rwp).
Next.js remains a static export with image optimization disabled; updating its
package does not establish that these advisories were exploitable in production.

Current npm audit results from both generated lockfiles:

| Scope | Before: critical / high | After: critical / high | Remaining moderate | Production dependencies only |
| --- | --- | --- | --- | --- |
| Root | 2 / 12 | 0 / 0 | 6 | 0 findings |
| Frontend | 3 / 16 | 0 / 0 | 9 | 0 findings |

Remaining entries trace to development-only minimatch/glob/TypeScript-ESLint
dependencies. The reported minimatch range requires an 11.x replacement; npm
proposes major upgrades or unrelated downgrades. This task does not override
those packages across major boundaries. The finding concerns
[glob-pattern amplification](https://github.com/advisories/GHSA-g3hv-75wg-m249);
there is no public IP/ASN endpoint accepting glob patterns. Audit counts are
time-specific dependency evidence, not a general security certification.

### Behavior fixes and compatibility

- New record writes are validated with the shared schema before persistence.
  Writes and reads use the same 2,000,000-character limit; invalid records,
  unrepresentable dates and over-limit payloads cannot be reported as saved.
- Deleting a selected record re-reads storage, preserving records written after
  the page snapshot. Storage events refresh other open compare views.
- Legacy history can be inspected read-only without rewriting its IDs or shape.
  Invalid legacy JSON is isolated from usable current records.
- Basic browser observations now copy the initial snapshot instead of retaining
  a mutable reference that later acquired Canvas/Audio/etc. fields. Collector
  version is `2.0.1`; older versions are preserved and compared as incompatible.
  Record validation is loaded on save/export to preserve the lightweight entry.
- Connection response body/header request IDs now match. CORS wraps rate-limit
  responses and exposes request ID and retry metadata to browser clients.

### Validation

- Updated dependencies: root typecheck and lint passed; **32 backend tests passed**.
- Frontend: lint and static build passed; **14 frontend tests passed** with Vitest 4.
- Registered OpenClaw browser run: **124 assertions passed**, artifact directory
  `/Users/openclaw/artifacts/iphey-optimization/20261106-123549/`. This receipt
  includes frontend tests, lint, build and browser execution.
- Browser API calls use redirects to a loopback HTTP fixture running the actual
  application Hono handler, normalization and cache path. Only provider responses
  and reverse-proxy IP metadata are synthetic. Recorded counters: **6 HTTP API
  requests, 5 provider attempts**; API visits are absent during all-route navigation.
- This includes legacy read/recovery and all earlier 49-route, mobile, accessibility,
  cancellation, WebRTC cleanup and comparison checks. Browser page errors: zero.
- Local audit reports and browser summary: `output/playwright/2026-11-06-continuation/`.

The default fast browser mode still supports explicit API-response fixtures;
`IPHEY_HTTP_INTEGRATION=1` selects the stronger loopback HTTP mode. Neither mode
is a deployed Cloudflare or live-provider canary.

### Environment observations

`npm update` initially failed in npm 10.9.3 with `Cannot read properties of null
(reading 'edgesOut')`; lock resolution used the established legacy peer policy
and clean installs then passed. A fresh full frontend graph resolution was
stopped after prolonged metadata resolution; updating the existing frontend
lock under the declared ranges completed successfully.

The `oc exec` SSH multiplex transport also returned
`mm_send_fd: sendmsg(1): Message too long` before remote execution. Bounded install
and root checks used non-multiplexed SSH to the same OpenClaw host with its
resource guard. Managed browser validation used `oc e2e` and completed with a
passing receipt. No host-local profile or SSH configuration was modified.

Read-only public rechecks: frontend HEAD 200, custom API TLS failure, and recorded
workers.dev health path HEAD 404. Auth remains unverified by a credential canary;
no deploy, account change, paid-provider request, DNS challenge infrastructure or
real-user performance measurement was performed.


## Reliability and delivery continuation

Completed on 2026-11-06, still based on HEAD `9d79f33d` with the current working
tree candidate. No credential use, commit, push or publication was performed.

### Changes

- Incoming cancellation reaches the lookup service and cooperative upstream
  fetches. Shared lookups track subscribers: a single cancelled caller does not
  interrupt other callers, while the last cancellation releases that in-flight
  entry and aborts its upstream signal. Old completion cannot delete a newer job.
- IPbot Retry-After and retry-delay waits are cancellable, with timers/listeners
  released on exit.
- Cache payloads are revalidated for the queried IP and maximum source age.
  Malformed KV envelopes cannot masquerade as fresh observations. Expired reads
  no longer trigger KV delete operations.
- IPbot TTL decisions retain the complete provider classification and score;
  a zero score cannot hide a classification-driven short refresh interval.
- KV physical retention respects the documented
  [60-second minimum](https://developers.cloudflare.com/kv/api/write-key-value-pairs/),
  while application expiry remains independent and can be shorter. No new KV
  namespace, cache migration or distributed-lock claim was introduced.
- Complete legacy flat hardware observations remain accepted by v1 reporting.
  Missing measurements are rejected without fabrication. The API reference now
  describes required measurement inputs rather than a misleading userAgent-only
  example.
- The global ignore pattern had hidden the public root `.npmrc`. A root-specific
  exception makes its peer-resolution policy part of the reviewable candidate.
  The file contains no credentials.
- The existing Actions quality job now runs frontend tests and a static build
  before its dependent deployment job. YAML parsing and the corresponding local/
  OpenClaw commands were validated; no GitHub workflow was submitted or run.

### Final evidence

Registered OpenClaw E2E receipt and artifacts:
`/Users/openclaw/artifacts/iphey-optimization/20261106-130142/`.

- Worker typecheck and lint passed; **41 backend tests passed** in seven files.
- Frontend lint and build passed; **14 frontend tests passed** in four files.
- **125 browser/HTTP assertions passed**; 49 sitemap routes, mobile geometry,
  core automated accessibility checks and browser page-error checks remain green.
- The new HTTP cancellation test closes an actual loopback client request and
  verifies a distinct disconnect reason at the provider AbortSignal. It cannot
  pass merely because the provider's timeout elapsed.
- Counters: 7 HTTP API requests, 6 synthetic provider attempts, 1 provider abort,
  and 1 confirmed HTTP-disconnect abort. Browser page errors: zero.
- Existing concurrent-request tests cover one cancelled subscriber alongside a
  continuing subscriber and the final-subscriber cancellation path. Cache tests
  cover wrong-IP data, over-age data, malformed expiry fields and KV retention
  versus application expiry.
- YAML parsed successfully; Linux SWC and Rolldown bindings are present in the
  lockfiles. The Vite 8 graph uses Rolldown instead of a Rollup native binding.
- Local copies: `output/playwright/2026-11-06-reliability/`.

Provider data and reverse-proxy IP metadata remain synthetic. These results do
not prove live Cloudflare disconnect behavior or deployed-provider availability.
Already-dispatched KV SDK operations are not advertised as abortable. The
previous dependency audit results remain applicable; no dependency versions
changed in this continuation.

The release readiness check remains blocked on a proven deployment-auth path.
The checker identifies the production slug as `iphey`; the isolated, registered
QA lane is `iphey-optimization` and has passing managed receipts. The checker's
`unregistered` production-slug result must not be mistaken for missing QA.
Production publication still requires the explicit authority specified in the
confirmed ENDGAME contract.
