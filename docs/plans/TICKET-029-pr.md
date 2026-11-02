# Ticket

Ticket: TICKET-029

# Summary

Admins can request an email code, sign in and sign out through themed pages. Exact server-side allowlisting rejects other addresses with a friendly message. Sessions stay in httpOnly cookies.

# Changes

- Add /admin/sign-in and /admin/sign-out, linked from the existing admin placeholder.
- Validate email and code inputs and recheck verified identity against ADMIN_EMAIL_ALLOWLIST.
- Keep Auth requests on the server; never return session tokens or provider errors to the browser.
- Set httpOnly, SameSite=Lax cookies, with Secure on the HTTPS canonical site.
- Provide local OTP email templates and copy them into managed worktree configurations.
- Document deployment requirements and rollback in docs/admin-auth.md.

# Acceptance criteria and evidence

- [x] Allowlisted sign-in and friendly rejection: eight auth unit cases plus real local Mailpit delivery/verification on mobile and desktop.
- [x] httpOnly cookies and no localStorage tokens: two cookie-policy tests and real browser assertions, including removal on sign-out.
- [x] Unit and local email end-to-end coverage: wrong code, successful code, replay refusal and sign-out verified against this worktree's isolated Supabase stack.

# Verification

Verified against develop eb0969c28a02dfd00513c7a93f8372731e7fabbb.

- pnpm verify passed: formatting, lint, typecheck, unit suite, build and browser smoke (449 passed, 123 conditional skips).
- pnpm verify:quick passed.
- Real local Auth command documented in docs/admin-auth.md: six browser checks passed on mobile/desktop.
- Separate layout-shift checks: two passed, measured CLS 0.
- Screenshot matrix: 36 passed and visually inspected.

Generic CI does not run the opt-in real Auth tests; local evidence covers those. Physical phones, hosted SMTP and hosted Auth configuration are not verified.

# Risks and rollout

No database migration or RLS changes. Configure the private ADMIN_EMAIL_ALLOWLIST and HTTPS canonical site URL; empty allowlist denies all. Hosted Supabase requires matching code templates and SMTP before launch. Route authorization (TICKET-032) and MFA (TICKET-030) remain separate requirements: the current admin placeholder is not protected by this ticket.

For existing managed worktrees, regenerate their isolated config/templates using wt:new after stopping only their own stack, preserving backups. Roll back the application and template/config changes together; keep Auth consumers compatible with httpOnly cookies.

# Screenshots

All originals and four contact sheets: [UI evidence](docs/reviews/TICKET-029/README.md). Routes /admin, /admin/sign-in, /admin/sign-out at 375/768/1280 in ivory-gold, midnight-champagne, emerald-night and blush-sage.

# UI checklist

- [x] Screenshots: all 36 inspected and committed.
- [x] Tokens: shared theme classes and Input/Button; no new literal design values.
- [x] Restraint and typography: plain admin surface, 18px body/controls and headings at least 32px.
- [x] Mobile: no overflow; 44px controls, safe-area spacing.
- [x] Motion: no new animations; reduced-motion checks pass.
- [x] Keyboard: labelled forms, visible focus and focused status response.
- [x] Contrast: all-theme A/AA axe checks, including denied state.
- [x] Load and images: CLS 0; no new image assets or fonts.
- [x] Performance: N/A to admin-only routes; guest pages unchanged.
- [x] Copy: friendly messages with no provider errors.
- [x] Shared components: existing controls reused.
- [x] Sharing and devices: guest sharing N/A; physical phones explicitly untested.
- [x] QR codes: N/A, no QR output change.
- [x] Staff feedback: pending states and readable focused status; scan/haptics N/A.
- [x] Verification: full local gate passed.

# Harness changes, if any

Managed worktrees now copy local email templates alongside generated Supabase configuration. No hooks or verification rules were changed.

# Review steps

1. Configure a fixture allowlist against the isolated local stack using the documented command.
2. Visit /admin/sign-in and confirm an unlisted address is refused.
3. Request a code for the fixture address, read its local mail, enter a wrong code then the delivered code.
4. Confirm success and use /admin/sign-out. Verify cookie removal and return to sign-in.
