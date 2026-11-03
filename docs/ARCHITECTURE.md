# Architecture and access boundaries

## Data flow

Customer pages call server readers which return published snapshots. Administrative endpoints resolve an independent team session cookie, require matching active staff and current credential version, then authorize each action. Browser navigation and hidden buttons are not the security boundary.

Team identity is now independent of Sites/ChatGPT. The application ignores ChatGPT identity headers for administrative authorization. Passwords use WebCrypto PBKDF2-SHA256 with a random per-account salt and 100,000 iterations (Workers-compatible). Random 256-bit session tokens and activation tokens are stored as SHA-256 digests. There is no public registration or email delivery. Sessions expire after eight hours; HttpOnly/SameSite=Lax cookies are Secure on HTTPS.

## Roles

| Operation | Support | Editor | Reviewer | Owner |
| --- | --- | --- | --- | --- |
| Published library, replies, packs, questions, feedback | Yes | Yes | Yes | Yes |
| Draft content/history, upload/read private images | No | Yes | Yes | Yes |
| Submit/restore draft | No | Yes | Yes | Yes |
| Publish, return review, archive/unarchive | No | No | Yes | Yes |
| Content export, audit | No | No | Yes | Yes |
| Staff and invitation management | No | No | No | Yes |

The initial owner is provisioned through a trusted local/operator database procedure. No owner is created from a public request, a ChatGPT login, or a matching email header. Only owners create team members and activation/reset links. Links expire after 24 hours and are consumed atomically once. Disabling or changing roles deletes sessions and activation links. Resetting passwords invalidates session credential versions. The owner cannot be disabled/demoted through the member UI.

## Publication

`guide_articles` separates `draft_json` / `draft_summary` from `published_json` / `published_summary`. Saving edits updates only the draft and revision. Publication requires a review-state revision, publication rights, complete content/evidence fields and valid image references. Internal verification notes are stripped from the public snapshot.

Revision creation, conditional article update, public-media references and the audit event are one D1 batch. Both revision and current-row predicates protect against concurrent updates. The second writer receives 409 and must reload, rather than silently overwriting changes.

Archive clears the public snapshot and all public media references for that article. Restoring a historical version creates a new draft; it never republishes automatically. Original seed content only fills IDs absent from the database. An archived database record overrides its seed and therefore cannot reappear accidentally.

## Images

Uploads accept bounded PNG/JPEG/WebP bytes with supported signatures and reject SVG. Bytes are written to R2 under server-generated UUID keys; metadata is stored in D1. A failed metadata write removes only the just-uploaded task-owned object. Unpublished images require staff authorization. Public image requests require a currently published reference; responses use `no-store` to make revocation meaningful for subsequent requests. Fixed initial screenshots are intentionally public assets.

Image highlights use percentages and remain attached to the same screenshot region across viewport sizes. Full/focused viewing preserves image aspect ratio. Highlight controls annotate the image; they do not alter the ERP or claim a screenshot is a completed transaction.

## Customer activity guides

The selected delivery model is a general guide per activity: `/guides/activity/{activity}` with `/print` for customer PDF printing. These read only current published snapshots. Admin delivery displays six reusable links and copyable handover messages; no per-customer identifier is required. Legacy pack APIs/links are retained for compatibility but are no longer the primary workflow. Public guides contain no team exports, editorial notes or private records.

## Legacy packs

Packs contain no ERP credentials or user record IDs. A pack selects activity/modules and optionally exact article IDs. Reads resolve the latest published matching snapshot, so withdrawn articles stop appearing and draft edits remain hidden. The server rejects activity mismatches and empty initial selections. Revoking a pack prevents its link and print route from resolving; it does not erase the article library.

Pack links are bearer knowledge links after public deployment. They are not a way to expose confidential customer data. Use generic titles and anonymized welcome text.

## Feedback and request handling

Writes require same-origin requests and staff authorization when applicable. JSON and multipart bodies are size-limited while streaming. Fields and image references are validated server-side. Customer comments are plain text rendered with React escaping. Daily duplicate feedback is prevented by a unique database key. Rate limiting uses salted hashes; raw customer IPs are not stored. No analytics/third-party message delivery is implemented.

## Portability

The source keeps the bundled Sites/Vinext integration and build output contract. Local D1/R2 and hosted D1/R2 are separate. Migrations are schema-only and immutable after application; content seeding is an idempotent application operation. Do not run local test fixtures or role substitutions against hosting.

## Local completion pass — 2026-11-03

Support sharing now selects an eligible active customer guide before copying an article URL; unscoped preview URLs are labeled for team use. Customer PDF article links retain the guide scope. Regression fixtures create their own UUID staff accounts rather than resetting the actual owner. Legacy anonymous-library/activity expectations were updated to fail closed. Default local launcher, framework and stop script use port 5174. Error text no longer claims a failed save could not have persisted.

Added twenty illustrated private articles from ten visually reviewed current read-only native blank-modal screenshots, with route/time/hash evidence and append-only import. Current content is 446 drafts plus five bounded published seeds, 37 genuine screenshot assets and 75 illustrated catalog drafts. No ERP data mutations or source edits occurred. Eighteen pure checks, eleven lifecycle groups, four role groups, nine auth groups, revocation/delete regression, TypeScript, full-repository lint, formatting and production build passed. Local desktop/mobile sample and actual four-page customer PDF were visually checked. Publication and hosted verification remain deferred; draft transaction/business qualification remains pending.
