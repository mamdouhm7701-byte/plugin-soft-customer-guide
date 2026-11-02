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
- Hosted identity uses Sites/ChatGPT dispatch authentication. Local development has a loopback-only mock identity.

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

Source, migration definitions, 390 editorial draft answers, five published seed articles, bundled images and documentation. `INSERT OR IGNORE` imports preserve existing content. New installations must import the shipped draft batch from the admin library.

GitHub does not include live D1 records, R2 uploads, staff membership, content edits in the local database, secrets or local sessions. Use the administrative export and a separately authorized media/database backup for migrated runtime content. The source archive is not a live data backup.

Excluded: `.dev.vars`, real `.env` files, `.wrangler`, `.sites-runtime`, `node_modules`, generated builds, QA outputs and credentials. `.env.example` contains empty server-only keys. The source package has been checked for these excluded paths.

## Hosting boundary

A GitHub repository stores source; GitHub Pages alone cannot execute the current server/auth/database/image-upload features. The present integration targets Sites with D1/R2. Another host needs explicit identity/storage/runtime adaptation. `.openai/hosting.json` preserves the existing Site identity. Site publication remains deferred by the user; uploading to GitHub does not publish the website or make drafts public.

## Current readiness

Ten model/catalog tests, TypeScript and production build passed on 2026-11-03. Four local authorization groups passed, including catalog restrictions. Browser visual/mobile QA and actual dynamic PDF printing remain pending. The 390 editorial articles are private drafts; financial/business procedures and missing step screenshots require verification before customer publication.
