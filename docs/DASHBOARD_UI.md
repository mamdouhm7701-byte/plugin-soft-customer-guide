# Existing UI refinement — 2026-11-04

User requested keeping the current application rather than adopting a replacement concept. Existing navigation, identity, roles, customer scopes and workflows are preserved. Dashboard metrics gain consistent native Lucide icons; three task shortcuts retain their established destinations. Library export/import and readiness/coverage controls are collapsed by default to prioritize search and sharing and remain accessible through native details controls.

## Staff charts

The authenticated dashboard endpoint adds bounded D1 aggregates. Workflow counts use archived state first, otherwise editorial status; each record belongs to one bar. The live-published metric separately counts active published snapshots, including records with newer drafts. This distinction is explained in the chart. Feedback bars show actual yes/no votes across all time, with unresolved negative feedback separately labeled. Top-five open questions use the team's recorded frequency. No visits, sent WhatsApp messages, customer identities or artificial trend data are inferred.

The charts use horizontal bars with visible Arabic labels/counts and accessible list names, and hide decorative tracks from assistive technology. Empty datasets display explanatory text. The dashboard offers manual refresh and links to the corresponding team section. No chart library or dependency was introduced.

## Verification

Source baseline eed19dc; working tree was clean before this task. tests/dashboard-data.mjs checks anonymous rejection and compares every aggregate with the actual loopback D1 dataset using an isolated temporary owner that is removed afterward. It passed. TypeScript, focused ESLint and production build passed. Native Chromium checks covered dashboard rendering, three chart panels, library navigation, initial collapsed tools, PS-001 search and no document overflow at exact 320/390/1280 widths. Current desktop/mobile PNGs were visually reviewed. Temporary browser pack/member/session were removed; designated owner was untouched. No ERP source, transaction or CI run was involved.

## Publication

The configured dedicated Site lookup returned project_not_found on 2026-11-04 under the current account. No replacement Site was created and deployed version 5 identity was preserved. Source is prepared for publication when account access is restored. No claim of a hosted UI update is made.

## Publication completed

2026-11-04: owner access restored; dedicated Site version 6 deployed successfully from 04078865064bf3c326275af364c4ba01cd8e058b. Deployment appgdep_6aeb40bdc9208191b858754e5a55ec05. Earlier access blocker is resolved. Audience, authentication and storage bindings were retained. Live: https://pluginsoft-customer-guide.biggerfrond1.chatgpt.site .
