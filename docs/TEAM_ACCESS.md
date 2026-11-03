# Independent team access and scoped customer guides

Current user choices: independent team email/password and a separate revocable guide per customer, scoped to one activity. The earlier general-activity delivery preference was superseded. Initial owner identity is held only in the local runtime/database, not reproduced in knowledge files.

## Entry points

- `/team/login`: team email/password sign-in. No public registration, ChatGPT dependency, or automatic mailbox access.
- `/team/activate#token=...`: owner-issued one-use activation/reset link. The fragment is removed from browser history after mount and is never a request URL/query parameter. The token is submitted only to the same-origin activation endpoint.
- `/admin`: team workspace. Unauthenticated requests redirect to login; APIs return 401. Every API checks current membership/role server-side.
- `/guides/<id>`: a saved active customer guide. No customer account is required; possession of its bearer link grants scoped access. Its print view and article links retain the same scope. General activity routes require staff access and are not customer handover links.

## Role boundary

| Capability | Support | Editor | Reviewer | Owner |
| --- | --- | --- | --- | --- |
| Published answers, replies and activity handover links | Yes | Yes | Yes | Yes |
| Questions and customer feedback | Yes | Yes | Yes | Yes |
| Drafts, private images and content editing | No | Yes | Yes | Yes |
| Publish/archive/import, Excel/internal PDF and audit | No | No | Yes | Yes |
| Add/disable/change role or issue password reset | No | No | No | Yes |
| Change own password, requiring current password | Yes | Yes | Yes | Yes |

Changing role or disabling an account deletes its sessions and activation links. Old browser sessions cannot revive after reactivation. Password changes delete every session and pending reset. Reset issuance closes the account's sessions. There is no shared administrator password.

## Password/session design

Random salts, PBKDF2-SHA256 (100,000 Workers-compatible iterations), constant-work hash comparison, random 256-bit tokens, hashed token storage, eight-hour sessions, 24-hour one-use activation, server-side credential-version joins, generic invalid-login messages, and per-email/IP rate limits over 15-minute windows. All writes require same origin. Login and activation bodies are bounded. Secrets and passwords are never written to audit or logs. Rate limits use the configured GUIDE_RATE_SECRET salt; the service fails closed if it is absent.

Operational security still requires HTTPS, operator-approved deployment/origin configuration, monitoring and backup/restore. MFA, transactional email, SSO and automated identity recovery are not implemented or claimed. Admin recovery requires a trusted operator, not a public reset claim.

## Provisioning and deployment

Apply migration `0003_team_auth.sql` after reviewing duplicate normalized staff emails (unique lower(email) index). Existing ChatGPT staff rows/content are preserved but do not automatically become password accounts. Owner must issue activation to those members. Legacy invitation allowlists do not confer access.

For the local loopback development database only: `node --experimental-strip-types scripts/provision-team-owner.mjs <owner-email>`. It refuses a mismatched existing owner, creates or recovers only that trusted local owner, revokes sessions and writes a private activation HTML file under ignored `.sites-runtime`. It never targets hosted D1 or prints tokens. Do not rerun recovery during ordinary startup. Current local regression checks use temporary UUID staff identities and preserve the designated owner.

Hosted bootstrap needs a separately reviewed operator procedure/environment scope. The helper is local-only; no hosted database or secret was changed and the website remains unpublished. Do not deploy the new source without the migration and initial owner activation/recovery procedure.

## Earlier evidence (superseded by the current regression record below)

Sixteen pure/model/export/password checks passed. Nine loopback auth groups passed: independent login/error/CSRF, rejected old identity headers, single-use activation, role isolation, reset revocation and old-password replacement, self-password change, account disable revocation, logout revocation and six anonymous activity guide/print routes. Existing eleven lifecycle checks and four role groups passed with password login fixtures. No new live ERP session occurred. Browser visual interaction and actual printing remain unverified.

## Revised customer delivery choice

The primary handover UI creates a separate pack per customer with one activity, selected modules and optional selected published articles. General activity routes are staff-only references and are absent from personalized customer navigation. Customer packs have no activity picker, team link or global-home link. Article/related/copy/print links preserve guide scope. Server readers reject out-of-pack article/print requests and invalid/revoked packs. A bearer link does not authenticate an individual customer; anyone holding it can open the guide. Do not put sensitive customer data in pack title/welcome.

Validation: TypeScript passed. Loopback scope check passed for no global/team navigation, accepted member article/print, rejected a published out-of-pack article/print and rejected revoked article/pack print. Only the check-owned local pack was removed. Browser visual QA remains pending.

## Revocation boundary fix

Anonymous users can no longer enumerate the global library, open general-activity pages, fetch arbitrary published article APIs or print outside a valid pack. Opening a valid customer link establishes an HttpOnly bearer-context cookie, rechecked against the current pack state on every request. Removing the guide query parameter falls back only to that cookie, never to the global library. Revoked/deleted/missing context fails closed. The root page offers no public library fallback; staff retain preview access. Published uploaded media is checked against the active guide. Fixed bundled screenshots remain nonsensitive static assets; this is not DRM and cannot retract content already downloaded.

Guide deletion uses revision-checked deletion plus an audit record in one database batch. Original articles are retained. Validation: tests/customer-revocation.mjs creates/removes only its own local pack and support fixture; it does not replace the designated owner. Previous tests expecting unrestricted anonymous article enumeration are historical contracts superseded by this access policy.

## Current regression checks (2026-11-03)

Independent-login checks now use a temporary test owner, leaving the designated owner untouched. Nine auth groups, four role groups and eleven lifecycle groups passed with the per-customer access contract. Anonymous activity/print routes reject access. Customer revocation/delete regression passed. Support reply sharing requires choosing an active guide whose activity, module and optional article selection include the published answer. No eligible guide exposes a text-only copy action. Legacy unrestricted-public contracts are superseded.

## Single-answer replies (2026-11-03)

Support now selects an eligible guide and explicitly generates an opaque answer-only link before copying. It does not expose the parent guide identifier; it has no related/return-to-guide navigation. Every article, API, print, feedback and uploaded-media access rechecks current parent scope. Old full-guide links retain their full-guide meaning. See SINGLE_ANSWER_SHARING.md for security and regression evidence.
