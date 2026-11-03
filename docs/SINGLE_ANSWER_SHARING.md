# Single-answer delivery and lightweight guidance

## Requested behavior

Prerequisites only occupy a full customer section when explicitly marked important. General context opens from a small details button; unnecessary context can be hidden. Empty prerequisites never render a section. Existing records default to details without rewriting published content. The editor persists the choice through the normal draft/review/publication lifecycle. Customer print follows the important-only rule; team XLSX retains the source text and display mode.

A negative helpfulness vote opens an optional comment field. Both submit with an empty comment and skip-comment submission are accepted. Team feedback review and existing abuse/daily duplicate controls remain in place.

Support selects an eligible active customer guide and generates a single-answer link before copying. The copied link grants only its published answer, including scoped print, feedback and uploaded images. It does not expose the parent guide identifier, related links, activity selection or a return-to-guide action. Existing full handover links remain full handover links: use the new reply action to send one answer. No messages are sent automatically.

## Access design

The server issues an AES-GCM authenticated encrypted capability containing the parent guide and article identifiers, using a purpose-separated key derived from the existing server-only GUIDE_RATE_SECRET. Each generation uses a fresh random IV. No database migration, new password, public registration or secret rotation is required. Parent identifiers cannot be extracted by base64-decoding the capability. No raw capability is written to audit documentation or source.

Every access rechecks the active parent guide, current activity/module/article selection and published answer. Archive/delete or removal from the guide denies further access; reactivation restores eligible links. The grant is a bearer link, not an individual customer account. A separate full-guide bearer link still grants its own authorized scope. Previously delivered full-guide links are not silently converted into answer-only links.

Opening a reply establishes an HttpOnly answer context and clears the old pack context. An answer cookie takes priority over stale full-guide cookies in anonymous article APIs. Invalid/revoked answer context fails closed. Explicit answer context is also carried into feedback and uploaded-media requests to avoid cross-tab cookie confusion. Customer metadata is noindex/nofollow and avoids exposing another answer title through an unauthorized route.

## Lightweight help

Action hints explain copying, answer-link generation, guide stop/activation/delete, exports and feedback. They appear on mouse hover or keyboard focus and via an adjacent information button on touch devices. Escape, pointer leave or focus leaving the control dismisses them. Tooltips stay within the viewport. Clipboard failure exposes the actual text for manual copying instead of telling a team member to copy the admin URL.

## Verification and scope

Baseline: GitHub source 3e1c14a9ed0a9234e955761aa19d8e243c5ed8f1; dedicated Site source fdb6fcf923f17ae92a5fb01efa3afbb2d2b34f39, version 2. ERP application/automation source is not modified by this work. No ERP transactions, outbound messages, real owner reset or CI runs are part of verification.

Local checks: 24 pure tests passed, including altered/wrong-key capability rejection and prerequisite display rules. tests/single-answer.mjs passed for a fresh anonymous link, singleton article/API/print access, hidden parent, negative empty-comment acceptance and archive/delete revocation. The pre-existing customer-revocation regression also passed. Fixtures use isolated UUID staff, packs and feedback articles and remove only their owned records. TypeScript passed; focused ESLint has zero errors and existing image-optimization warnings.

Native Chromium visual/interaction checks passed for all three prerequisite modes at exact emulated 390px and 1280px viewports (six samples), without horizontal overflow. A real click opened the details dialog and the information hint; empty-comment skip reached the success state. The team generated an opaque reply URL from its actual dialog. Mobile hint, details-dialog and feedback PNGs were visually reviewed. Earlier probes clicked before hydration or while smooth scrolling; the final probe waited for hydration and used immediate native scrolling. Physical iOS/Safari is not certified.

## Deployment

Dedicated Site version 3 deployed successfully on 2026-11-03 from source 399a6c4a96f6d6ff582e4e3f80859911b08dff65. Deployment: appgdep_6aea234415e48191bc2a3d675f968b93. Existing public audience, independent team authentication, server secret revision and database bindings were preserved. No database migration or owner recovery was needed. Live: https://pluginsoft-customer-guide.biggerfrond1.chatgpt.site . The final local access regression passed after restarting the task-owned Vite/Miniflare process following an HMR ECONNRESET.

Hosted non-mutating smoke checks passed: health/login/image 200, anonymous admin 401, unscoped library and invalid reply routes 404. These requests used infrastructure dispatch authorization without an app staff session; no production customer record was created. Full answer-link interaction evidence is local, not a claim of a real customer production session.
