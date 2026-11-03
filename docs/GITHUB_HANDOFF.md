# Reviewed ERP content expansion — 2026-11-03

Published dedicated Site version 2: **401 articles** (396 reviewed ERP catalog articles plus five initial guides) and **178 genuine assets**. HR remains deferred. Native deployment succeeded on 2026-11-03. Live: https://pluginsoft-customer-guide.biggerfrond1.chatgpt.site .

Source is maintained on the private codex/code-quality-review branch; main is unchanged. The dedicated Site source checkout is C:/Users/pcx/Desktop/PluginSoft_Guide_Site; the GitHub working source is C:/Users/pcx/Desktop/PluginSoft_Customer_Guide. Runtime D1/R2 contents, team passwords and activation material are not part of source or ZIP backups.


## Release behavior

The approved snapshots and digests are in lib/released-articles.json and docs/evidence/release-review.json. Existing published, archived, reviewed or edited customer records win. On authenticated staff startup, only an untouched revision-one imported draft whose validated content matches a pinned pre-review baseline can receive this reviewed bundled release. The update, history and audit entry are guarded in one D1 batch. Changed/restored drafts are excluded, and publication never extends to HR. New installations seed only the reviewed release. Initialization uses bounded batches and skips existing articles/history.

The Actions screen was corrected from an assumed approval-definition screen to the actually observed copy/move tabs. Posting and ZATCA send buttons were not used. Full company, registration and tax-ID captures were excluded; native bounded field/card captures contain no company identifiers. No ERP save/delete/post/send operation ran.
