# Reviewed release — 2026-11-03

The user requested HR be deferred and completed content published. The reviewed release contains 47 additional entries: 16 bounded source-backed business concepts, ten current native master-form navigation guides and 21 current blank-form field guides. Together with the original five entries, 52 articles are available for customer guide selection. All other catalog content stays private; no HR article was newly published.

`lib/released-articles.json` contains the exact released content. `docs/evidence/release-review.json` pins the IDs and content digests. Current field guides were rewritten around the actual rendered labels, with no save, posting or financial-result claim. Source concepts retain formula conditions and exact source provenance. Attaching an image alone does not approve a release.

The local release used the ordinary revision-checked submit/publish APIs and refused edited/archived records. Replay skips already published entries. Fresh hosted installations seed only the reviewed release and initial articles with INSERT OR IGNORE; existing database rows always win, including unpublished and archived rows.

## Dedicated hosted owner enrollment

The operator sets server-only GUIDE_BOOTSTRAP_EMAIL, GUIDE_BOOTSTRAP_TOKEN_HASH and GUIDE_BOOTSTRAP_EXPIRES. Only the hash of a random 256-bit activation token is configured. Raw activation material stays in an ignored local HTML file and is never packaged. It is valid once for 24 hours.

The activation endpoint can initialize only the fixed configured owner, only when no owner exists, and cannot replace credentials or regenerate a consumed activation record. Visitor input never selects the owner email or enrollment hash. Existing local owner credentials remain untouched. Normal password activation, throttling, same-origin and single-use guards still apply. Clear the three enrollment settings after successful activation; keep GUIDE_RATE_SECRET configured.

The public Site audience allows customers to open their scoped bearer links without ChatGPT sign-in. Independent team email/password protects administration. The root is not an unrestricted customer library, and a live customer pack must be created by the team before a customer can open its articles.
