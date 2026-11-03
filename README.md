Published release: 52 articles (47 reviewed ERP additions plus five original guides). Remaining 420 catalog records stay private; HR is deferred. Dedicated live Site: https://pluginsoft-customer-guide.biggerfrond1.chatgpt.site . Hosted login/access smoke checks passed; owner enrollment is configured and awaits the user choosing a password. See docs/RELEASE.md.

# Plugin Soft Customer Guide

Arabic RTL training handover and support knowledge platform. Current local source: 2026-11-03. Dedicated Site version 1 is published; HR remains deferred.

## Stack and location

React 19 and TypeScript, Vinext/Vite with App Router conventions, Cloudflare Workers, D1/SQLite with Drizzle, R2 uploads, and Zod validation. Excel export uses ExcelJS; PDF delivery uses browser print layouts. This is a standalone application, separate from the ERP Java/Selenium automation repository.

Workstation source: `C:/Users/pcx/Desktop/PluginSoft_Customer_Guide`. Private GitHub repository: [plugin-soft-customer-guide](https://github.com/mamdouhm7701-byte/plugin-soft-customer-guide). Reviewed source is synchronized on the private codex/code-quality-review branch; main remains unchanged; the dedicated Site is deployed from its separate source repository.

## Run locally

Requires Node.js >=22.13. Run `npm run install:ci` for a fresh checkout, then double-click `START_GUIDE.cmd` or run `node scripts/local-preview.mjs`. The launcher prepares ignored local environment values, applies local migrations and uses port **5174**.

- Team login: `http://127.0.0.1:5174/team/login`.
- Administration: `http://127.0.0.1:5174/admin`.
- Customer entry: a saved `/guides/<id>` link; the anonymous root is not a global library.
- Stop a launcher-owned process with `STOP_GUIDE.ps1`. Manually started servers are owned by their terminals.

On a fresh database, provision the designated owner using `node --experimental-strip-types scripts/provision-team-owner.mjs owner@example.com`. This trusted **local-only** recovery command creates a single-use activation file in ignored `.sites-runtime/`; it revokes existing owner sessions and must not be rerun during ordinary startup. Set the password through that private activation link. Team sign-in uses independent email/password; no ChatGPT identity headers grant membership.

Loopback addresses cannot be sent to remote customers. Source ZIPs exclude the local database, sessions, runtime files and uploaded R2 media.

## Customer and team behavior

Each customer receives one guide scoped to its activity, trained modules and selected published articles. Customer navigation has no activity switcher or global-library fallback. Every article/API/print/uploaded-media request rechecks active guide scope. Stopping or deleting a guide blocks subsequent access; deletion preserves the original articles. Anyone holding a live bearer link can use it; downloaded material cannot be revoked.

Team roles are enforced on the server: owner manages members, reviewer reviews/publishes/exports, editor prepares drafts, and support uses published replies and customer guides. Draft edits do not replace a published snapshot until reviewed publication. Support selects an eligible active customer guide before copying a reply link. The app sends no customer messages automatically.

The platform includes illustrated answers, image focus overlays, Arabic search, repeated-question tracking, customer feedback, revision history, audit history, per-customer printable handovers, XLSX export and team PDF print layouts. Exports include private editorial information and stay within the team. Excel includes image references; it does not embed image binaries or replace a database/media backup.

## Content and verification boundaries

- 467 catalog records, including 47 reviewed releases and 420 private drafts, plus five initial articles (472 total; 52 published).
- 154 genuine screenshot assets: 127 current read-only native captures, 25 historical registry images and two original sales-form assets.
- 349 catalog articles have at least one image reference; 260 have a reference in every step. A reference may illustrate the same form across steps; it is not proof those steps or financial outcomes were executed.
- All 71 individual report criteria forms are captured, individually reviewed and linked to their exact report article. No report output was run or qualified.
- 118 catalog articles have no image; 207 lack at least one step image. The reviewed release includes 52 published articles; remaining drafts stay private.
- Written guidance maps 106 active screens, 71 reports, eleven modules and six activities. Twenty-one bounded source business rules retain exact source hashes; all hashes were rechecked against ERP source.
- Independent team roles/password login, scoped customer packs, revocation/delete, XLSX and browser PDF layouts are implemented locally. A dedicated guide Site is live; the separate ERP/EduPro Site was not changed.

The importer preserves existing records and revisions. `scripts/add-live-ui-content.py` imports only the specifically reviewed native blank-modal captures with route/time/hash evidence. See [content provenance](docs/CONTENT_CATALOG.md), [current verification](docs/VERIFICATION.md), [team access](docs/TEAM_ACCESS.md) and `STATUS.json`.

## Checks

```text
npm run typecheck
npm test
npm run format:check
npm run lint
node --experimental-strip-types tests/local-integration.mjs
node --experimental-strip-types tests/local-roles.mjs
npm run test:auth
npm run test:customer
```

Loopback integration/auth/role checks create their own temporary staff identities and never replace the designated owner's password or role. Their content fixtures are archived after lifecycle checks. Local browser and server checks do not certify hosted D1/R2, public delivery or deployment.

## Deployment and handoff

Preserve the original Sites identity in `.openai/hosting.json`. Before publication, apply migrations through `0003_team_auth.sql`, configure server-only `GUIDE_RATE_SECRET`, provision the hosted owner through a reviewed operator procedure, and verify independent sign-in, guide revocation, storage and customer routes in the hosted environment. There is no public owner-bootstrap endpoint. GitHub Pages alone cannot run the application's server/D1/R2 features.

Generate the source handoff with `python scripts/package-source.py`. See [operations](docs/OPERATIONS.md) and [GitHub handoff](docs/GITHUB_HANDOFF.md). Version 1 is published; see docs/RELEASE.md.

The latest mobile/source-business pass is documented in docs/VERIFICATION.md. The dedicated guide Site is live; the separate ERP/EduPro Site must not be modified.
