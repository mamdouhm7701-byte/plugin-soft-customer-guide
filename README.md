# Plugin Soft Customer Guide

Full-stack Arabic RTL customer knowledge library and training handover platform. Version 1.0.0, 2026-11-02.

The application is independent of the ERP Selenium repository. No ERP source was changed and no ERP test suites were run during this implementation.

## Run locally

Requires Node.js >=22.13 and installed dependencies. On this workstation the dependencies and local schema are already prepared.

- Double-click `START_GUIDE.cmd`, or run `node scripts/local-preview.mjs` from the project directory.
- Customer library: `http://127.0.0.1:5173/`
- Team administration: `http://127.0.0.1:5173/admin`
- Local sign-in uses the starter's loopback-only development identity. It is absent from production builds.
- `STOP_GUIDE.ps1` stops only a process recorded by the launcher after checking its identity. A manually started development server must be stopped by its owning terminal.
- Loopback links are local previews, not customer-shareable Internet links.

For a fresh checkout, run `npm run install:ci` once, then `node scripts/local-preview.mjs`. The launcher creates an ignored local `.dev.vars` with development-only values, builds if needed, applies pending migrations locally and starts a hidden loopback process. It does not publish or contact the ERP. Local startup logs are under `.sites-runtime/`.

## Implemented features

### Customers

- Anonymous-compatible library, Arabic-normalized search, activity and module filters.
- Stable article URLs under `/help/<id>`; only published snapshots are exposed.
- Prerequisites, activity/screen limitations, numbered illustrated steps, highlight overlays, focused/full-image viewer, expected result and warnings.
- Related articles, copy-link action, persistent feedback and print/PDF layouts.
- Saved handover guides under `/guides/<id>` and printable versions under `/guides/<id>/print`.
- Guides select activity, trained modules and either specific articles or all applicable published articles. Archived guides stop resolving.

### Team

- Server-enforced membership and roles: `owner`, `reviewer`, `editor`, `support`.
- Support library with ready reply plus permalink; no automatic customer messaging.
- Content editor, step reordering, image upload/library, highlight placement, internal verification notes and preview.
- Draft -> review -> published workflow. Draft edits preserve the prior published snapshot. Optimistic revision checks reject concurrent/stale updates.
- Revision history, restore-as-draft, review comments and archive/unarchive.
- Server-backed screenshot storage; uploaded private images become publicly readable only while referenced by a published snapshot.
- Handover guide creation/editing/revocation and copyable handover message.
- Repeated-question queue with frequency counts and linkage to a suitable published answer.
- Customer feedback review, content export, staff allowlist/role management and audit log.
- In-app Arabic team usage guide.

## Content boundary

The initial dataset has five screenshot-backed articles using two genuine authorized Demo screenshots. They document opening general sales screens, locating item search and totals, and preparing a support question. No transaction was saved, no ERP records were modified, and no financial or inventory rule was qualified by those captures.

Restaurant, Construction, Concrete, Car Showroom and HR are supported content categories, not claims of completed coverage. General-sales procedures are scoped to `general`; only the generic support-intake guidance applies to all activities. Authors must publish verified, activity-appropriate procedures progressively. Finishing the ERP automation coverage is not a prerequisite for operating this platform.

## Technology and source map

- Vinext / React / TypeScript with the bundled Sites runtime integration preserved.
- D1 for content, revisions, roles, packs, questions, feedback and audit records.
- R2 for uploaded image bytes; fixed brand assets and initial screenshots under `public/assets`.
- `lib/guide-model.ts`: validation, public types, activity/role rules and search normalization.
- `lib/guide-server.ts`, `lib/guide-write.ts`: identity, database access, publication transactions and snapshot separation.
- `app/api/admin/`: authenticated write/read operations; public API routes expose published data only.
- `components/guide/`: customer library, article, photo viewer, feedback and print UI.
- `components/admin/`: team workspace, editor, packs, media, staff and question queue.
- `db/schema.ts`, `drizzle/`: schema and immutable sequential migrations.
- `tests/`: model and local API integration/role verification.
- `docs/`: architecture, operations and release verification.

## Local verification

```text
node node_modules/typescript/bin/tsc --noEmit
node --experimental-strip-types --test tests/model.test.ts
node tests/local-integration.mjs
node tests/local-roles.mjs
```

Integration and role tests deliberately refuse external hosts and use the separate local preview database. They create test-owned records; role verification temporarily changes only the starter's local test identity and restores it in `finally`. Do not run these against a user session or hosted database. `scripts/clean-local-test-data.mjs` removes only explicitly named task-owned local QA records; read its SQL/evidence before use. No general data-deletion API is exposed.

## Hosting

Publication is deferred at the user's explicit request. The original Sites identity remains in `.openai/hosting.json`; do not create a replacement Site. The intended audience is public customer read access plus authenticated, allowlisted team administration. Never expose the Site before hosted identity/secrets and server-side authorization are verified.

Required hosted runtime secrets:

- `GUIDE_BOOTSTRAP_EMAIL`: the designated owner's verified sign-in email. It is used only for initial owner creation and must never be copied into source or the browser bundle.
- `GUIDE_RATE_SECRET`: random secret salt for feedback identifiers/rate limiting.

Hosted D1 migrations, R2 provisioning, real identity, audience settings and delivery links still require deployment verification. The current local tests do not certify those external services.

## Verification limits

The build, TypeScript checks, seven model tests, eleven local lifecycle cases and four local role groups pass. Genuine screenshots and the earlier PDF pilot were visually inspected. A first customer-library DOM was observed in the browser; complete interactive desktop/mobile QA could not finish because browser control became unavailable. This remains explicitly pending, not a fabricated pass. See `docs/VERIFICATION.md` and `STATUS.json`.

## Expanded screen and business FAQ catalog

The local library contains **390 private editorial drafts**, preserving the original 107 and adding 283. The new batch maps 106 active inventoried ERP/HR screens and 71 individual ERP reports; the removed audit/history screen is excluded. There are **9 genuine screenshot assets** total, referenced in 19 catalog drafts where appropriate. Seven are historical QA UI examples, not successful business execution evidence. Most operational steps still need current screenshots and verification before customer publication.

The answer library includes a searchable screen coverage map, module/activity/status filters, an illustrated-content filter and draft preview with accurate non-public status. On a fresh installation an owner/reviewer imports all shipped questions from the library button. Repeating import preserves existing content. See [catalog provenance and index](docs/CONTENT_CATALOG.md). No ERP source, live data or customer occurrence frequency is modified. The five existing public articles remain available; publishing is deferred.

## GitHub handoff

See [GitHub source handoff](docs/GITHUB_HANDOFF.md) for the exact stack, source layout, setup and storage/hosting boundaries. Repository: [mamdouhm7701-byte/plugin-soft-customer-guide](https://github.com/mamdouhm7701-byte/plugin-soft-customer-guide) (private). Source upload is separate from website deployment; publishing remains deferred.
