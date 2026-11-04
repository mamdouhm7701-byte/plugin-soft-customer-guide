# Handover and content follow-up improvements — 2026-11-04

Baseline: 6c6a3a5 on codex/code-quality-review. Standalone guide repository only; no ERP/HR application or automation edits.

## Delivered behavior

1. Customer libraries render 24 matching cards initially, then another 24 through Show More. Activity/module/search changes reset the displayed batch. Search and section counts use the complete authorized summary set, including entries not rendered yet; images remain lazy. This reduces DOM/image work, not the complete summary payload.
2. Modern handover selection supports selecting every current search match, removing those matches while preserving other choices, and displaying selected-only entries. Forty choices render initially; additional batches do not affect selection. Existing empty-selection validation and unlimited handover size remain.
3. Shared team templates persist in D1. A template saves activity, modules, explicit/all mode and welcome message. The server replaces the customer title with a generic title. Applying a template starts a new unsaved guide; it never updates an existing customer guide. Unpublished/out-of-scope explicit IDs are excluded with an explanation, and an empty explicit selection never becomes all-matching. Creation/reading use existing authenticated guide-team access. Deletion requires creator or owner and leaves an audit record; existing guides remain independent. Templates are immutable: create another template to revise the configuration.
4. Active saved guides offer a native modal with the actual customer URL in 390px mobile or 1080px desktop frames. Narrow screens scroll inside the preview, not across the team page. Stopped guides have no preview action. Preview follows normal customer scope/revocation and is not a separate snapshot. Feedback inside the actual guide remains real feedback; the preview states this explicitly.
5. Team home shows ten articles ranked by unresolved negative feedback, then negative vote count and total votes, plus ten open questions ranked by recorded frequency. Actual D1 aggregates drive these panels. No view/customer counts or effectiveness percentages are invented. Published articles can be found in the library; unpublished feedback still has a follow-up action.

The sun/moon control is now on the left, vertically separated from button help, with safe-area spacing. The navigation area uses a Plugin Soft blue/purple gradient with light labels. Existing themes, motion preferences and classic interface remain available. New wizard/template/preview workflow tools belong to the modern interface.

## Storage and compatibility

Additive migration 0004_handover_templates.sql adds only guide_templates. Existing data, scope rules, bearer links, auth and support replies are unchanged. Source rollback can leave the additive table in place; do not drop it as part of rollback. Future deployment must apply the new migration before serving template endpoints. Local preview migration was applied locally only. D1 backups are needed for persisted templates; the source ZIP is not a data backup.

## Verification and limits

TypeScript and 27 pure tests passed. Focused ESLint has no errors (existing lazy-image optimization warning). Production build passed. Local HTTP/SQL integration verifies unauthenticated denial, shared template read, persisted selections, generic title, no customer-guide side effect, foreign-template deletion denial for support, owner deletion/audit, invalid modules, and feedback counts against D1. Temporary owned fixtures were removed. Existing customer revocation and independent answer-link regressions passed.

Browser interaction/visual QA is unavailable because Work browser use is disabled. Modal switching, bulk checkbox interaction, colors and overflow have not been newly browser-verified in this turn; build/HTTP evidence does not replace that verification.

Publication is pending access to the original dedicated Site: get_site returned NOT_FOUND. No replacement Site or production database operation was performed. Last verified live release remains version 8; the newer unlimited-handover and current workflow updates are local/GitHub work until deployed.

## Publication completed

Owner access restored on 2026-11-04. Native deployment of version 9 succeeded: appgdep_6aeb5522db608191945c91e56bbfc2ec, source 6407f775b78aa3b740812c49a5fc075c8ec01b21. Existing public audience and environment revision 1 retained. Sites applies schema migrations before Worker upload. Last known rollback is version 8; leave the additive template table intact on source rollback. Browser UI verification remains bounded by the previously documented Work setting.
