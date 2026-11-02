# Architecture and access boundaries

## Data flow

Customer pages call server readers which return published snapshots. Administrative endpoints resolve the dispatch-authenticated identity, require a matching active staff row, then authorize each action. Browser navigation and hidden buttons are not the security boundary.

Sites dispatch owns hosted sign-in and identity headers. The shipped starter's local auth mock is restricted to loopback development and removed from production builds. No custom OAuth implementation, plaintext password store or public bootstrap endpoint is introduced.

## Roles

| Operation | Support | Editor | Reviewer | Owner |
| --- | --- | --- | --- | --- |
| Published library, replies, packs, questions, feedback | Yes | Yes | Yes | Yes |
| Draft content/history, upload/read private images | No | Yes | Yes | Yes |
| Submit/restore draft | No | Yes | Yes | Yes |
| Publish, return review, archive/unarchive | No | No | Yes | Yes |
| Content export, audit | No | No | Yes | Yes |
| Staff and invitation management | No | No | No | Yes |

Owner membership is bootstrapped only from the server-side configured verified email when no owner exists. Public ChatGPT sign-in does not itself confer staff membership. Disabling a staff row blocks every subsequent administrative request. The primary owner cannot be disabled/demoted through the UI.

## Publication

`guide_articles` separates `draft_json` / `draft_summary` from `published_json` / `published_summary`. Saving edits updates only the draft and revision. Publication requires a review-state revision, publication rights, complete content/evidence fields and valid image references. Internal verification notes are stripped from the public snapshot.

Revision creation, conditional article update, public-media references and the audit event are one D1 batch. Both revision and current-row predicates protect against concurrent updates. The second writer receives 409 and must reload, rather than silently overwriting changes.

Archive clears the public snapshot and all public media references for that article. Restoring a historical version creates a new draft; it never republishes automatically. Original seed content only fills IDs absent from the database. An archived database record overrides its seed and therefore cannot reappear accidentally.

## Images

Uploads accept bounded PNG/JPEG/WebP bytes with supported signatures and reject SVG. Bytes are written to R2 under server-generated UUID keys; metadata is stored in D1. A failed metadata write removes only the just-uploaded task-owned object. Unpublished images require staff authorization. Public image requests require a currently published reference; responses use `no-store` to make revocation meaningful for subsequent requests. Fixed initial screenshots are intentionally public assets.

Image highlights use percentages and remain attached to the same screenshot region across viewport sizes. Full/focused viewing preserves image aspect ratio. Highlight controls annotate the image; they do not alter the ERP or claim a screenshot is a completed transaction.

## Handover

Packs contain no ERP credentials or user record IDs. A pack selects activity/modules and optionally exact article IDs. Reads resolve the latest published matching snapshot, so withdrawn articles stop appearing and draft edits remain hidden. The server rejects activity mismatches and empty initial selections. Revoking a pack prevents its link and print route from resolving; it does not erase the article library.

Pack links are bearer knowledge links after public deployment. They are not a way to expose confidential customer data. Use generic titles and anonymized welcome text.

## Feedback and request handling

Writes require same-origin requests and staff authorization when applicable. JSON and multipart bodies are size-limited while streaming. Fields and image references are validated server-side. Customer comments are plain text rendered with React escaping. Daily duplicate feedback is prevented by a unique database key. Rate limiting uses salted hashes; raw customer IPs are not stored. No analytics/third-party message delivery is implemented.

## Portability

The source keeps the bundled Sites/Vinext integration and build output contract. Local D1/R2 and hosted D1/R2 are separate. Migrations are schema-only and immutable after application; content seeding is an idempotent application operation. Do not run local test fixtures or role substitutions against hosting.
