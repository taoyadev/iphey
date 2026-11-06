# IPhey target contract

Status: confirmed by the user, 2026-11-06. Implements the six packages in
the user's IPhey optimization plan. Existing unpublished work is preserved.

## User outcome

Check the current environment, understand observed evidence, change one setting,
then repeat and compare. Primary tasks are `/`, `/ip`, `/leaks`, and `/compare`.
Keep existing seeded IP/ASN, fingerprint, guide and documentation URLs. Arbitrary
IP/ASN queries use `/ip?ip=…` and `/asn?asn=…`; static export does not promise new
dynamic detail routes. No existing public URL must break.

## Ownership and transport

Keep Next.js static export, Cloudflare Pages, Worker/Hono, and KV. The Worker owns
production API execution. Browser probes run only after an explicit action;
precise location and optional AI require separate actions. DNS and independent
IPv4/IPv6 checks stay explicitly unavailable until verified infrastructure exists.

Keep valid v1 paths and existing valid request fields. Fix collectors to satisfy
the existing schema now. Introduce a versioned observation contract for nullable
measurements rather than silently changing numeric v1 fields. Legacy endpoints
must return a structured unavailable error when no truthful result exists;
they must never fabricate location, risk or a successful safety verdict.

## Versioned observations

Each scan has a random scanId, schemaVersion, collectorVersion, rulesVersion,
subject, scope, startedAt and completedAt. Every probe carries its own status,
value (nullable), source and observedAt; retrievedAt and source time are distinct.
Statuses distinguish observed, not-run, unsupported, blocked, timeout, no-result,
unavailable and error. Completion and risk are independent. No statistical
population uniqueness, entropy or confidence is presented without calibration.

Bind enrichment to the IP observed in the same scan. A newer scan supersedes an
older request. Cancellation and deadlines cover the entire operation. A probe
failure cannot remove successful evidence. Retained results retain their original
time and visibly disclose failed refreshes.

## Storage and compatibility

Records belong to this browser, saved only on request. A new versioned local
record envelope retains probe scope and versions. Read legacy records without
overwriting them; identify them as legacy and exclude unsupported comparisons.
No automatic destructive migration of populated local records or shared KV data
is required. Comparison reports changed, unchanged, missing and incomparable.
Default exports redact full IPs, coordinates and stable fingerprint identifiers.
Clear-history actions cover the related local copies. Storage failure is visible.

Version incompatible shared cache keys so old payloads cannot masquerade as new
observations; let old entries expire rather than migrating populated caches.
No account, tenant, paid resource, deployment or production migration is included.

## Request cost

Arbitrary IP lookup is an on-demand tool, with bounded provider attempts and a
shared total deadline (initial target eight seconds). Fresh and bounded stale
cache results carry real source/time; expired entries cannot become current.
Instance-local deduplication retains pending work until completion and releases
by identity. Visitor requests cannot start bulk warming. Shared service status
reads a bounded internal snapshot, never provider checks per visitor.

## Acceptance and delivery

Implement IPHEY-01 through IPHEY-06 in order of dependencies; retain explicit
not-provided states for DNS and separate dual-stack infrastructure. Competitor
claims require dated primary evidence before publication. Core checks, mocked
negative-path regressions and managed OpenClaw desktop/mobile/keyboard QA are
required. Existing environment failures are recorded separately. No production
publication is authorized by this implementation task.


## Production authorization

On 2026-11-06 the user explicitly requested production deployment. This supersedes
the earlier implementation-only publication restriction for the accepted IPhey
candidate. Authorized targets are the existing `iphey-api` Worker, `iphey` Pages
project and their documented `api.iphey.org` / `iphey.org` domains in the verified
`taoyadev` Cloudflare account. The existing main-to-Actions release route is used.
Unrelated account resources and new paid infrastructure remain out of scope.
