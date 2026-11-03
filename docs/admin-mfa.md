# Admin two-step sign-in

After email-code sign-in, /admin requires an allowlisted, server-verified account with a verified TOTP factor and an AAL2 session. An account without a verified factor goes to enrolment at /admin/mfa; an existing factor gets the code challenge. Email sign-in, sign-out and MFA bootstrap actions are deliberate AAL1 exceptions: they cannot read or change wedding data.

The server fetches the current user and factors from Auth, verifies token claims with getClaims(), checks matching subjects, and applies the exact email allowlist. It does not trust a decoded browser cookie or cached session user. Revoked membership, missing verified factors and failed identity checks deny access. Enrolment cannot replace an existing verified factor from an AAL1 session. A restarted enrolment removes only the current user's abandoned, unverified TOTP factors. Verification accepts only a factor returned for that authenticated account and rechecks AAL2 afterward.

## Protecting new admin code

A layout redirect alone is insufficient: Next.js can render child content into a streamed response before the layout resolves. Each admin page's data-producing component must call requireAdminPageAccess() before producing protected content. The protected layout also guards navigation. Identity reads use React's request-scoped cache, never a shared persistent cache. They wait for a real request with connection(), preserving framework control-flow exceptions.

Every privileged server action must call withAdminAccess() itself before its operation; layout checks do not authorize actions. Current action files contain only the explicitly documented sign-in/sign-out/MFA bootstrap endpoints. TICKET-032 extends route authorization to staff and future business endpoints. Do not place private data in a child component that renders before its own access check.

## Setup and recovery

Local TOTP enrolment/verification is enabled in supabase/config.toml. Regenerate an existing owned managed worktree after stopping its stack with backups preserved. Hosted Auth must have TOTP enabled before deploying this requirement; no hosted service or paid plan was changed here. Test an approved administrator before rollout to avoid a lockout.

The setup QR and manual key appear only in the authenticated enrolment response and browser memory. Never log, persist in localStorage, put in URLs or commit generated setup keys. Admin responses suppress referrers and indexing. Screenshots use the public example key JBSWY3DPEHPK3PXP and an explicitly labelled matching example QR; those images are not real enrolled credentials.

If an authenticator is lost, a trusted wedding administrator must independently verify the person's identity, then use the approved Supabase administration process to reset the factor. Email access alone must never authorize bypassing MFA. No public reset, recovery bypass or SMS flow is added. Physical authenticator scans on iOS/Android still require device evidence before release.

## Verification and rollback

Run the isolated fixture browser test with ADMIN_EMAIL_ALLOWLIST containing mfa-mobile@example.test,mfa-desktop@example.test and RUN_ADMIN_MFA_TESTS=1. MFA_TEST_PREFIX optionally changes the fixture prefix; the allowlist must match exactly. CAPTURE_MFA_SCREENSHOTS=1 captures the five-state theme/width matrix and checks keyboard, axe and rendered QR decoding. These opt-in tests use only the worktree's loopback Auth and mail catcher. Successful runs remove their own fixture factor; failed runs may leave isolated fixture accounts/factors. Do not reset a real account to rerun tests.

No database migration, RLS change or new dependency. Roll back application code through the normal PR flow if needed; keep enrolled factors intact. Restoring an email-only app version removes the application AAL2 requirement, so it is a security regression and must not be treated as a safe launch rollback without review.

References: [Supabase TOTP](https://supabase.com/docs/guides/auth/auth-mfa/totp), [MFA assurance](https://supabase.com/docs/guides/auth/auth-mfa).
