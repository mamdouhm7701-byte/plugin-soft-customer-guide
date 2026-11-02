# Operation and release procedure

## Editorial lifecycle

1. Capture a repeated question without customer personal data; set activity/module and source.
2. Reuse an existing published answer if suitable. Otherwise create a new draft.
3. Write the short answer, scope, prerequisites, numbered steps, expected result, warnings and ready support reply.
4. Upload genuine redacted screenshots, select the image for each step, and position highlights by clicking the image or editing percentage values.
5. Record the actual verification date and internal evidence limitations. Do not infer full behavior from a Page Object, menu screenshot or historical report.
6. Save, preview, submit for review. A reviewer validates the procedure and publishes the reviewed revision.
7. Link the repeated question to the published answer. Monitor customer feedback and revise through new drafts.

Support actions copy text/links only. The employee decides when and where to send the reply; the application never sends email, WhatsApp or other messages automatically.

## Training handover

Select the trained activity/modules and either all matching published articles or a fixed set. Save a generic, non-sensitive title and welcome message. Preview the customer link, copy the handover message and optionally open the printable version. Test the actual customer link from an unauthenticated session after deployment before handing it over. Never send loopback URLs to customers.

## Staff onboarding

The owner adds the exact email the employee will use for ChatGPT sign-in and assigns Support, Editor or Reviewer. The application stores an allowlist entry, not a password, and sends no invitation email. The employee visits `/admin` and signs in. The first matching sign-in creates the stable staff membership. Revoking a pending invitation prevents enrollment; stopping an existing member blocks administration immediately.

## Backups

The content export downloads JSON containing articles, revision history, packs and media descriptors. It does **not** include R2 image bytes or replace a database/storage backup. Keep a separate D1 and R2 backup procedure in the hosting environment before production adoption. The source ZIP includes source code, migrations, original fixed assets and documentation; it deliberately excludes live databases, uploaded media, credentials and local QA data.

## Future publication (currently deferred)

1. Recover access to the same project ID in `.openai/hosting.json`; never create a duplicate because account context is missing.
2. Inspect the current audience and configure verified owner bootstrap and feedback salt as server-only secrets. Do not copy email/token values into source or the client bundle.
3. Build/package exact source with the Sites helper. Include the D1 schema migrations and keep `d1: DB`, `r2: BUCKET` bindings.
4. Verify the hosted app while private, including owner enrollment, all denied-role cases, private images and draft separation.
5. Apply the user-authorized public customer audience through Sites access controls. Staff routes must still require active membership server-side.
6. Deploy the exact saved source version; inspect the terminal deployment status and actual URL.
7. Check an anonymous customer article/pack, feedback, customer print page, authenticated administration and a rejected unauthorized account. Record only actual hosted observations.

Do not weaken access checks, bypass sign-in or expose private image bytes to compensate for a hosting/connector outage.
