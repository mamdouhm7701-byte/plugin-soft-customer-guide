# Independent support answers and contextual help

## Current behavior — 2026-11-03

Training handover and support answers are separate workflows. Handover packs still restrict a client to its activity and selected training content. The team shares an answer directly from its row using Share Answer: opening the dialog automatically prepares the answer link, with no client or handover selector and no additional generation step. Copy the answer/link or open the customer preview. No outbound message is sent automatically.

New answer capabilities contain only their answer identity and are authenticated/encrypted with AES-GCM using a purpose-separated key from the existing server-only GUIDE_RATE_SECRET. The public answer view has no library, related-answer, activity-selection or handover navigation. APIs, print, feedback and uploaded images stay scoped to that published answer. Unpublishing/archiving the answer denies further access. Creating, disabling or deleting a training pack has no effect on a new independent answer link. Anyone holding a bearer link can open its one answer without a team login.

Previously issued guide-bound capabilities retain their original narrower guide checks for compatibility. They are not silently broadened. Use Share Answer to generate a new independent link. No migration, owner-password change or environment-secret rotation is needed.

## Prerequisites and feedback

Only prerequisites explicitly marked important occupy a customer section before the steps. General context is available in a small details dialog; unnecessary context can be hidden. Empty prerequisites never render. The choice follows draft/review/publication. Customer print includes important prerequisites; team XLSX keeps source text and display mode. Negative feedback supports an optional comment or skip-comment submission. Daily duplicate and abuse controls remain.

## App-wide hints

A delegated contextual layer covers buttons, navigation links and form controls throughout the customer and team app, including dynamically opened native dialogs. Explicit action/field descriptions take precedence over a control-name fallback. Existing curated hints remain. Desktop hover and keyboard focus show a small viewport-bounded tooltip; focus descriptions are associated with the control and restored afterward. No password or input value is read for hint content.

The mobile Help Buttons mode intercepts a control tap to explain it without executing its action. The user exits the mode to resume normal interaction. The toggle and tooltip are portaled into the current native dialog when needed, so they remain usable inside modal flows. Escape, scrolling and focus/pointer movement dismiss hints. Print output excludes the help controls. Clipboard failures expose the actual reply/link for manual copying.

## Verification

Baseline GitHub commit: 35757ddd444150c5f668906872dd188ccb103cc0. Baseline dedicated Site commit: 399a6c4a96f6d6ff582e4e3f80859911b08dff65 (version 3). ERP source and its analysis baseline were not changed.

Twenty-five pure tests passed, including independent capability tamper/wrong-key rejection and legacy-capability compatibility. The local single-answer regression passed: a link is created without a pack, opens in a fresh anonymous context, exposes one answer through article/API/print, accepts an empty negative comment, survives handover archive/delete, and is denied after answer archive. Existing customer-pack revocation regression is retained separately.

Native Chromium checks passed for important/details/hidden prerequisite modes at exact 390px and 1280px viewports, without horizontal overflow. Team UI generated the answer URL automatically, with no handover selector. Row-preview hints and mobile help mode were exercised; tapping Share Answer in help mode did not execute the action. Hover hints were exercised across dashboard, editor, handover packs, question backlog, feedback, media, staff, audit, account and team help. Current mobile/desktop PNGs were visually reviewed. These are bounded Chromium checks, not physical iOS/Safari certification.

Fixtures use only isolated local UUID staff, packs and articles. Their owned records are cleaned up; the designated owner is not reset. TypeScript and focused ESLint passed. Content remains 401 published explanations; HR and the previously unconfirmed business topics remain deferred.

## Deployment

Dedicated public-audience Site version 4 deployed successfully on 2026-11-03 from d9bb560a88f9de38d162b50d380285de40075240. Deployment appgdep_6aea299c3b808191acc583e751c90650. Existing authentication, D1/R2 bindings and secret revision 1 were preserved. Live: https://pluginsoft-customer-guide.biggerfrond1.chatgpt.site . The final article row uses lightweight hover descriptions instead of extra information icons; the global mobile help mode covers those controls.

## WhatsApp handoff (prepared, not deployed)

Team-only Send via WhatsApp buttons are available beside answer copy actions and active handover packs. Desktop opens https://web.whatsapp.com/send with URL-encoded prefilled text; mobile uses the official wa.me text-sharing path. No phone number or recipient is collected/stored. The member selects the chat and confirms sending in their own WhatsApp account. If not signed in, WhatsApp may require device linking. Browser-popup failure shows a copy fallback. Existing answer and handover scopes remain distinct.

Reference: https://faq.whatsapp.com/5913398998672934 . The focused encoding test, TypeScript and ESLint passed; no real message was sent and logged-in WhatsApp behavior was not exercised. Publication is currently blocked: configured Sites project returns NOT_FOUND for get_site and repository write credentials. Existing Site identity is preserved.
