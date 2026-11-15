# Email-only admin sign-in

Owner requested deferring authenticator enrolment and subsequent challenges on 2026-11-15.
Admin access now requires a live Supabase user, verified claims matching that user's ID,
and membership in the admin email allowlist. Both proxy and operation boundaries use this
policy. Existing factors remain intact; the dormant MFA service retains its own AAL2 checks.
No database migration, credential change or production configuration change is included.

## Browser evidence

On the active localhost preview, the owner's authorized email and local-only code opened
`/admin` with the Wedding control room heading and no setup button. `/admin/mfa` redirected
to `/admin`. Repeated at 375px: login, dashboard reload, legacy redirect and HttpOnly auth
cookies passed. Sign-out displayed the signed-out heading; the old test's status-role
selector did not match the newer local UI. A follow-up browser run waited for the signed-out
heading and confirmed `/admin` then redirected to sign-in. The regression now waits for either supported
signed-out presentation before checking denial of subsequent admin navigation.

## Review

Independent review checked retained identity/allowlist boundaries, redirects, optional MFA
assurance and dependent browser fixtures. Its findings were addressed, including preserving
cookie assertions and awaiting sign-out completion. Physical-device checks were not run.
