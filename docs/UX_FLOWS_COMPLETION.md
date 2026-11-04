# Completed UX flows — 2026-11-04

## Scope and evidence

Completed the five approved interface improvements against source baseline cd94609af37663c58f980cc072d24cd2bb15649e on codex/code-quality-review. This is the standalone customer guide, not the Java ERP automation repository. Content remains 401 published articles; HR remains deferred.

- Team home prioritizes Arabic answer search and daily actions before actual D1 charts. Search survives navigation and refresh.
- Modern navigation groups existing permitted destinations into daily work, content/follow-up, and administration/account. Server authorization remains authoritative.
- Training handover uses three steps: identity/activity, modules/articles, then review/save/share. Empty selections and selections over the existing 60-article API limit are blocked. Back navigation retains choices. Saving an archived guide does not activate it or offer an active delivery link.
- Customer articles prioritize the answer, illustrated steps and optional feedback. Secondary sharing/printing/help use compact disclosures. Mobile guides offer a scoped module selector; article contents and next-step anchors simplify navigation. Important warnings remain visible.
- Context hints cover new actions. Existing light/dark preference, reduced-motion handling and classic interface remain available.

Support answer links remain independent of training handovers. Customer scope, stopping/deletion, role checks and optional negative-feedback comments are unchanged. No application business rules, database migration, ERP saves or customer messages were introduced.

## Verification

26 pure tests passed. Four local role groups, independent-answer scope/revocation, customer-guide revocation and actual dashboard data comparisons passed. TypeScript, production build and focused ESLint completed without errors; existing image/navigation warnings and the large Excel client chunk remain.

Native Chromium exercised 320/390/1280 widths in both themes: home search/refresh, wizard validation, retained selections, local save, anonymous scoped guide, article navigation and printing links. Additional checks covered the classic handover form, archived-save behavior and actual menu bounds. Final mobile dashboard/article PNGs were visually inspected. This is bounded Chromium coverage, not a complete browser/device accessibility audit. All temporary local staff/session/guide fixtures owned by this check were removed; the designated owner was untouched.

## Rollback and publication

The header classic switch restores the previous library, navigation and handover form per browser. Full source rollback target is cd94609af37663c58f980cc072d24cd2bb15649e. The last verified hosted release is version 7, version ID appgprj_6ae9cb66ef2c8191891528ada54e7c38~appgver_53a842f93da0819197d47620af627d0f, deployment appgdep_6aeb45e9e0448191a273700d621141e8; that is the full deployment rollback target for these changes.

Publication of these new flows is pending: the existing dedicated Site appgprj_6ae9cb66ef2c8191891528ada54e7c38 returns NOT_FOUND in the current Sites account. No replacement site was created and no production deployment or database was changed. Resume deployment from the account/workspace that owns the existing Site.
