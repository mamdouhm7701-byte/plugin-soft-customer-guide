# GitHub source handoff

Target owner: `mamdouhm7701-byte`.
Repository: `plugin-soft-customer-guide`.
Repository URL: https://github.com/mamdouhm7701-byte/plugin-soft-customer-guide
Initial visibility: private. Creation was confirmed by the GitHub API on 2026-11-03 under the user-authorized account. Source upload is authorized; website deployment remains deferred.

## Stack

- TypeScript 5.9, React 19, Next.js App Router conventions.
- Vinext 1.0 beta with Vite 8 is the actual build/runtime adapter.
- Server route handlers run on a Cloudflare Workers-compatible runtime.
- Cloudflare D1 (SQLite) with Drizzle ORM and migrations.
- Cloudflare R2 for uploaded images; bundled reviewed screenshots in `public/assets`.
- Zod validation, Lucide icons, custom RTL CSS; Tailwind 4 and UI components are included in the starter dependencies.
- Team identity uses independent email/password sessions; see TEAM_ACCESS.md for trusted owner provisioning and deployment requirements.

## Source map

| Path | Responsibility |
| --- | --- |
| `app/` | Pages and server API handlers |
| `components/guide/` | Public customer library, articles and images |
| `components/admin/` | Team dashboard, editor, roles, packs and coverage map |
| `lib/` | Business data model, server rules and authored FAQ catalog |
| `db/`, `drizzle/` | Database schema and migrations |
| `public/assets/` | Branding and genuine bundled screenshots |
| `scripts/` | Local launch, build, database tools and source packaging |
| `tests/` | Model/catalog contracts and loopback integration checks |
| `docs/` | Architecture, operation, evidence and catalog provenance |

## Local run

Requires Node.js 22.13+ (verified here with Node 24). Install dependencies with `npm run install:ci`, then use `START_GUIDE.cmd` on Windows or `node scripts/local-preview.mjs`. The launcher prepares ignored local environment and database state. Read README and OPERATIONS for manual setup and verification limits.

Run `npm run typecheck` and `npm test`. Live ERP tests are not part of this project. Integration/role checks are local-only and can change their owned guide fixtures; never target a hosted/ERP environment.

## What GitHub stores

Source, migration definitions, 467 editorial draft answers, five published seed articles, bundled images and documentation. `INSERT OR IGNORE` imports preserve existing content. New installations must import the shipped draft batch from the admin library.

GitHub does not include live D1 records, R2 uploads, staff membership, content edits in the local database, secrets or local sessions. Use the administrative export and a separately authorized media/database backup for migrated runtime content. The source archive is not a live data backup.

Excluded: `.dev.vars`, real `.env` files, `.wrangler`, `.sites-runtime`, `node_modules`, generated builds, QA outputs and credentials. `.env.example` contains empty server-only keys. The source package has been checked for these excluded paths.

## Hosting boundary

A GitHub repository stores source; GitHub Pages alone cannot execute the current server/auth/database/image-upload features. The present integration targets Sites with D1/R2. Another host needs explicit storage/runtime adaptation and HTTPS/session-origin verification. `.openai/hosting.json` preserves the existing Site identity. Site publication remains deferred by the user; uploading to GitHub does not publish the website or make drafts public.

## Current readiness

Current local source snapshot — 2026-11-03

- 467 private catalog drafts and five separately published seed articles (472 shipped articles).
- 154 genuine screenshot assets: 127 current read-only native captures, 25 historical registry images and two original sales-form assets.
- 349 catalog articles have at least one image reference; 260 have a reference in every step. A reference may illustrate the same form across steps; it is not proof those steps or financial outcomes were executed.
- All 71 individual report criteria forms are captured, individually reviewed and linked to their exact report article. No report output was run or qualified.
- 118 catalog articles have no image; 207 lack at least one step image. Publication remains five seed articles; drafts are not silently exposed to customers.
- Written guidance maps 106 active screens, 71 reports, eleven modules and six activities. Twenty-one bounded source business rules retain exact source hashes; all hashes were rechecked against ERP source.
- Independent team roles/password login, scoped customer packs, revocation/delete, XLSX and browser PDF layouts are implemented locally. Website hosting remains the final, deferred stage; no separate ERP/EduPro Site was changed.

TypeScript, production build and twenty pure contracts passed. Local lifecycle/role/auth and scoped-customer revocation checks passed. Desktop/mobile samples and a scoped four-page customer PDF were visually reviewed. Runtime database edits, owner activation material and R2 uploads are not part of this source handoff. See VERIFICATION.md and STATUS.json for precise remaining limits.
