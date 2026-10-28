# Admin email-code sign-in

Open /admin/sign-in (linked from /admin). /admin/sign-out ends this device's session. The admin dashboard is still a placeholder; route protection and MFA belong to TICKET-032 and TICKET-030. These sign-in pages alone do not authorize future data operations.

Set the server-only ADMIN_EMAIL_ALLOWLIST to comma-separated exact approved addresses. Empty denies every request. Addresses are normalized to lowercase; wildcards and malformed addresses are rejected. Do not put the list in a NEXT_PUBLIC variable or commit real addresses. Update the private deployment environment and restart to apply changes. Allowlist membership is checked before requesting a code and again against the verified identity. Future privileged endpoints must independently check the verified user's membership.

Session cookies are httpOnly, SameSite=Lax, path /, and Secure when NEXT_PUBLIC_SITE_URL uses HTTPS. Production must use the real HTTPS canonical URL. Auth operations run only on the server; never introduce browser Auth clients expecting access to these cookies. Do not return access or refresh tokens from actions. A Supabase Auth account by itself is not an application admin role.

## Email configuration

Local Supabase uses supabase/templates/admin-code.html for both confirmation and magic-link emails. The template uses {{ .Token }} rather than a sign-in link. The managed worktree generator copies templates into the isolated configuration directory. For an existing owned worktree, stop its stack, rerun wt:new from an up-to-date checkout to regenerate configuration, then start it. Preserve local data backups; do not reset another checkout.

Hosted Supabase needs the same confirmation/magic-link template configured in its Auth email settings and a production SMTP provider before launch. No paid service, hosted template or real recipient was configured by this ticket. Keep Supabase's OTP expiry and rate limits enabled; transport/invalid-code failures return friendly messages without provider details. Supabase's local mail catcher is currently Mailpit (the ticket's older wording calls it Inbucket).

Sources: [Supabase email OTP](https://supabase.com/docs/guides/auth/auth-email-passwordless), [email templates](https://supabase.com/docs/guides/auth/auth-email-templates), [server-only cookie sessions](https://supabase.com/docs/guides/auth/sessions).

## Local verification

Use only the managed isolated stack. Start the production build with the fixture allowlist through the test command; do not change .env.local manually:

    pnpm build
    ADMIN_EMAIL_ALLOWLIST=admin-mobile@example.test,admin-desktop@example.test RUN_ADMIN_AUTH_TESTS=1 pnpm exec playwright test e2e/admin-auth.spec.ts --project=mobile --project=desktop --workers=1

The tests check worktree identity and local API port, read only matching fixture mail, verify wrong/used-code rejection, httpOnly session cookies, absence of localStorage Auth tokens, and sign-out. Fixture Auth accounts/mail remain only in the disposable local stack. Standard smoke tests also exercise denied addresses and all-theme layout/accessibility without requiring an Auth server.

Rollback application code and the local email template/config if needed; no database migration is included. Keep httpOnly cookie handling consistent with any remaining server Auth consumers. Production readiness still depends on allowlist, HTTPS/SMTP, MFA and route authorization.
