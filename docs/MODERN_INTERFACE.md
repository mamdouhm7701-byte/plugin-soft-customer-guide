# Reversible team interface and appearance — 2026-11-04

## Authorized scope

Implemented the approved library/share preview while preserving the existing Plugin Soft identity, navigation, team charts and customer authorization. The user subsequently requested light/dark appearance and lightweight selection animations. Baseline GitHub source: 6f0b5c5c5a5ee31b7e335cd3b96d5f3b85b28e0f. Baseline hosting source: 04078865064bf3c326275af364c4ba01cd8e058b, saved Site version 6.

## Interface

Modern library rows show title, short summary, module, step count, code and editorial status. Sharing is the primary published-answer action; edit/preview and secondary details move into an action menu. An archived answer cannot be shared from the modern list. Filters are collapsed until needed, with an active filter count and reset action. Readiness/coverage and export tools remain accessible. The share dialog prepares an independent answer link automatically, prioritizes WhatsApp and copy, and hides link-only copy/preview under additional options. Requests are cancelled when the dialog closes or the list unmounts.

The existing three D1-backed dashboard charts and their labels/empty states are retained. No visit counts, delivery receipts, artificial trends or new customer tracking were added. Content, editorial workflow and server authorization are unchanged.

## Revert without data migration

The team header has a Previous Interface / Improved Interface toggle. The classic library is preserved as ClassicArticleList.tsx from the baseline. The choice is stored per browser under plugin-guide-team-interface-v1; it does not change user permissions, content, shared links or the database. It is a display fallback, not a global product configuration. In a restricted browser, the choice can remain in memory when storage is unavailable. The editor's unsaved-change warning is retained.

The theme toggle is independent: classic and modern can use either light or dark. A complete source rollback can use the baseline commit above. For a full hosted rollback, deploy the existing saved version 6: appgprj_6ae9cb66ef2c8191891528ada54e7c38~appgver_590b22a1ac848191944a7b0de7ec7f1a. This release contains no database migration or content rewrite; do not restore an old database just to revert layout. Native hosting permissions still apply.

## Appearance and motion

The light/dark choice is stored per browser under plugin-guide-color-mode-v1 and applies to team pages, login and customer guides/articles. Initial appearance is read before the main body; subsequent changes synchronize through the appearance control. Native dialogs retain accessible theme controls through the existing modal portal. Real screenshots retain original colors. Print appearance resets to light with theme controls hidden. No external font, animation framework or chart dependency was added.

Small 140–160ms transitions cover buttons, selected navigation, dialogs, filters and menus. prefers-reduced-motion disables animations/transitions and smooth scrolling globally. Appearance controls and menu/filter buttons retain visible focus treatment and keyboard semantics.

## Verification

Twenty-six pure checks passed, TypeScript passed, focused ESLint had zero errors and one pre-existing location.assign navigation warning. Production build passed with the existing large Excel chunk warning. Loopback dashboard aggregate and single-answer authorization/revocation/feedback checks passed using isolated temporary identities.

Native Chromium exercised modern/classic switching and persistence, light/dark switching and persistence, filtering, independent-link sharing, collapsed extra options, and three dashboard charts at exact 320/390/1280 viewports in both themes (six combinations). No document horizontal overflow. Reduced-motion animation override and customer dark guide/article rendering were checked. Desktop and mobile light/dark screenshots were individually inspected; subsequent CSS fixes improved dark text contrast and reserved space for modal appearance/help controls. These are bounded Chromium observations, not a claim of physical iOS/Safari coverage or a real WhatsApp send.

Only task-owned temporary browser pack, staff and sessions were removed. The real owner, ERP source, external data and CI were not touched.

## Publication state

The current Sites account returned project_not_found for the dedicated Site. This update is prepared locally and in GitHub; it has not been deployed. Last verified production remains version 6. Reuse the existing Site identity when account access is restored.

## Publication completed — 2026-11-04

Owner access restored. Dedicated Site version 7 deployed successfully from b884ed19a70b3015a9a1d38843ca00058928b1c9. Deployment appgdep_6aeb45e9e0448191a273700d621141e8. Existing authentication, public audience and storage bindings were retained. Earlier access blocker is resolved. Per-browser classic display and saved version 6 rollback remain available. Live: https://pluginsoft-customer-guide.biggerfrond1.chatgpt.site .
