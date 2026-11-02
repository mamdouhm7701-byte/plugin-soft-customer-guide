# Verification record - 2026-11-02

## Completed

| Check | Actual result | Scope |
| --- | --- | --- |
| TypeScript `tsc --noEmit` | Passed | Authored application and bundled starter types |
| Sites/Vinext production build | Passed | All customer/admin/API/print routes compile |
| Model test suite | 7 passed, 0 failed | Seed validity, Arabic search, activity scope, publication requirements, image/highlight validation, role capability model |
| Local HTTP integration | 11 passed, 0 failed | Anonymous denial, forged headers, same-origin checks, draft privacy, private media, publication, concurrent revision conflict, handover/print, feedback deduplication, repeated questions, archive/restore |
| Local role integration | 4 groups passed | Support restrictions, editor restrictions, reviewer restrictions, inactive membership denial; local owner restored |
| Initial live screenshots | 2 inspected | Authorized ERP Demo general sales screen capture only; customer selection removed on unsaved forms |
| Customer library first render | DOM observed | Five published cards, modules and activity controls were present |

Machine-readable execution evidence is retained locally under ignored `qa/local-integration-evidence.json` and `qa/local-role-evidence.json`. This folder contains local-only test data and is excluded from the deliverable archive. Test-owned draft/pack/feedback/question records were cleaned from the local preview; no hosted or ERP data was cleaned.

## Pending and not claimed

- Complete real-browser interaction and mobile visual QA. Browser control subsequently returned disabled; no screenshot or viewport pass was fabricated.
- Actual PDF printing from the new dynamic print layouts. The source provides print rules, and print routes return correct bounded published content. The older six-page pilot PDF was visually reviewed; that does not certify the new browser print engine.
- Hosted D1/R2 resources/migrations, real dispatch sign-in, owner bootstrap, public audience and production-origin write checks. Publication was explicitly deferred by the user.
- Activity-specific business procedures beyond the five scoped initial articles. Activity names are taxonomy, not qualified ERP coverage.
- Long-term load, high-volume search, large content collections and production backup/recovery drills.

## Reproducibility

Start the local app through `node scripts/local-preview.mjs`. Run the checks from README. Integration tests only allow loopback and use task-owned test records. Role checks modify only the fixed local starter identity and restore it in `finally`. All hosted execution must use separate explicit environment scope and verified access.

## 2026-11-03 catalog verification

`node scripts/verify-local-catalog.mjs` loaded all 107 catalog drafts in the loopback app and verified idempotent replay, unchanged content/revision on repeat, five public articles only, inaccessible public draft, rejected anonymous import and rejected missing-origin import. It creates intended editorial content, not disposable QA content. Evidence: ignored `qa/catalog-evidence.json`. No ERP session, mutation or test was used.

Catalog schema/activity/reference checks: 2 passed. Existing model checks: 7 passed. TypeScript and production build passed after the catalog and module-filter additions. Browser interaction/visual QA remains pending as recorded above.

## 2026-11-03 expanded catalog and historical images

- Catalog/model checks: 10 passed (7 established model contracts, 3 catalog/coverage/image contracts). TypeScript passed.
- Local import: 283 added, 107 preserved; all 390 are drafts and a replay inserted zero. Public articles remain five. Anonymous and missing-origin imports were rejected.
- Coverage API requires editor/reviewer/owner. Role checks passed four groups, now including denied support GET/POST catalog, allowed editor GET coverage, denied editor import; owner restored afterward.
- All seven added bundled screenshots were visually inspected and served bytes matched their recorded SHA-256 hashes. An illustrated draft retained the correct local asset reference. These are UI-only historical QA images from failed/probe artifacts, not newly verified successful procedures.
- The first role-check attempt had a transient ECONNRESET during local dev refresh; the owner was confirmed restored and the bounded run then passed. Only the two task-owned role test drafts were removed. Cleanup now selects titles instead of full article JSON, avoiding child-process stdout overflow with the expanded library.
- Browser control reported disabled in Work settings. The user explicitly selected continuing with existing images/content. No fallback bypass or new ERP session was attempted. Desktop/mobile visual interaction and actual dynamic printing remain pending.
- Written guidance maps all 106 active screens in the consulted inventory plus 71 individual reports. This is not financial/business/permission execution coverage. No publication occurred.
