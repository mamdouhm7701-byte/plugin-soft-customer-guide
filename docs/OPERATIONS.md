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

The owner creates a member with their independent sign-in email and role. Deliver the one-use activation link through the team's approved channel; no email is sent automatically. The employee chooses a password, then signs in at `/team/login`. Resetting credentials and disabling membership revoke sessions. Owners must preserve their private activation/recovery material. See TEAM_ACCESS.md.

## Backups

The user-facing content export downloads XLSX, and PDF is produced through the authenticated print layout. The internal JSON export is transport data. Neither is a complete backup of the database, revision history and storage. It does **not** include R2 image bytes or replace a database/storage backup. Keep a separate D1 and R2 backup procedure in the hosting environment before production adoption. The source ZIP includes source code, migrations, original fixed assets and documentation; it deliberately excludes live databases, uploaded media, credentials and local QA data.

## Future publication (currently deferred)

1. Use a dedicated Site for this guide, as the user reaffirmed. The previous project ID remains historical identity; its lookup currently fails. Site selection/creation is the final stage. Do not modify the separate ERP/EduPro Site.
2. Inspect the current audience and configure independent owner activation and feedback salt as server-only secrets. Do not copy email/token values into source or the client bundle.
3. Build/package exact source with the Sites helper. Include the D1 schema migrations and keep `d1: DB`, `r2: BUCKET` bindings.
4. Verify the hosted app while private, including owner enrollment, all denied-role cases, private images and draft separation.
5. Apply the user-authorized public customer audience through Sites access controls. Staff routes must still require active membership server-side.
6. Deploy the exact saved source version; inspect the terminal deployment status and actual URL.
7. Check an anonymous customer article/pack, feedback, customer print page, authenticated administration and a rejected unauthorized account. Record only actual hosted observations.

Do not weaken access checks, bypass sign-in or expose private image bytes to compensate for a hosting/connector outage.

## Human-readable content exports

Owner/reviewer users can download an actual XLSX workbook from the answer library. The workbook contains all current draft records, including archived content, status/evidence notes and a separate step/image-reference sheet. The workbook contains image links, not embedded screenshot binaries; private image links require staff access. Strings remain text cells to prevent spreadsheet formula interpretation. ExcelJS is loaded dynamically only when exporting.

The PDF action opens `/admin/export/print`, a server-authorized internal print view with all current records and available images. Users choose Save as PDF in their browser. This is a browser print workflow, not a direct PDF binary download. It waits for fonts and image decoding before printing; a scoped customer PDF sample has been rendered and reviewed; pagination of the full internal catalog remains unqualified. Status and incomplete verification are clearly labeled.

Both exports include private editorial content and must remain within the team. These are readable exports, not full database/media/revision backups. The internal JSON endpoint remains a transport/backup API and is no longer presented as the user-facing download.

## Authentication migration notice

Independent team sessions supersede older references to ChatGPT login/bootstrap. See TEAM_ACCESS.md before starting/deploying the current code. The local review owner was converted from the guarded synthetic fixture to the user-selected email and now requires owner activation; current test fixtures use temporary UUID identities and preserve it. Never use the real owner database as a disposable role fixture. The current review preview remains on port 5174.

## Current local entry and support delivery (2026-11-03)

The current launcher and tests use port 5174. Earlier port-5173 previews are historical. The anonymous root and general activity URLs do not expose the library; deliver `/guides/<id>`. In the reply dialog select an active eligible customer guide before copying the article link. No compatible guide means text-only copying; create or update the correct guide first. A previously copied link still checks current guide state server-side.

Local auth/lifecycle/role tests use temporary UUID staff records with their own salted passwords, and remove those credentials/sessions afterwards. They do not rewrite the designated owner's account. Do not run these local fixtures against hosting.
