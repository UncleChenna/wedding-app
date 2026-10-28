# Ticket

Ticket: TICKET-030 — Require TOTP two-factor auth for admin accounts.

# Summary

Email sign-in previously left the admin placeholder accessible without two-factor verification. Admin entry now requires a live allowlisted user, verified matching claims, a verified TOTP factor and AAL2. Users enrol an authenticator or complete a returning-user challenge before admin content is produced.

# Changes

- Add server identity/AAL2 guard and an operation wrapper for every future privileged admin action.
- Add QR/manual-key enrolment, current-account factor verification, generic errors and identity-verified recovery guidance.
- Guard content production as well as the layout: a regression test caught protected content serialized before a layout-only redirect.
- Keep email sign-in, sign-out and MFA bootstrap accessible at AAL1; these explicit exceptions cannot access wedding data.
- Enable TOTP in the local Supabase template. Reuse themed QR geometry without changing guest QR encoding/quiet zones.
- Suppress admin indexing/referrers. Keep setup secrets out of logs, URLs, localStorage and committed screenshots.
- Adapt sitewide browser tests to wait for streamed auth redirects; split the existing form matrix into independently bounded cases without removing assertions.

# Acceptance criteria and evidence

- Unenrolled admin cannot enter protected pages: server unit tests, raw HTML regression and real email/TOTP browser flow.
- Privileged operations reject AAL1: guarded callback is never invoked for lower assurance, revoked allowlist membership, invalid claims or missing verified factor. Bootstrap exceptions are explicitly documented.
- Enrolment works at 375px: actual local Auth flow plus five-state, four-theme, three-width matrix; 44px controls, keyboard focus, axe and QR decoding.

Physical iOS/Android authenticator scanning remains unverified; release approval is not claimed.

# Verification

- 16 new guard/MFA unit checks pass; full unit run: 446 passed, 16 opt-in skipped.
- Real local email/TOTP and returning-user challenge: four mobile/desktop tests pass, including CLS = 0.
- MFA UI matrix: two tests pass; 60 screenshots, all theme/width states checked.
- Shared /dev/theme production capture: 12 pass.
- Redirect regression rerun: 138 pass, 106 conditional skips.
- Full local pnpm verify passed: format, lint, types, 446 unit tests (16 opt-in skips), production build and 481 browser checks (129 conditional skips). CI40685274231 passed all required jobs at 2023ccd; later metadata/docs heads require their own CI before merge. The t:pr full local gate also passed again (481 browser checks).
- Initial full gate failed on browser redirect races and an oversized test; all original assertions preserved in the fixes.

# Risks and rollout

No migration, RLS, lockfile or dependency changes. Hosted Auth must have TOTP enabled and an approved admin tested before rollout; no hosted setting was changed. Physical authenticator scans and native keyboard checks remain unverified. Recovery is a trusted, independently identity-verified operational process, not an email-only bypass.

Future privileged actions must call withAdminAccess themselves; layout checks do not authorize actions. Keep enrolled factors on rollback. Reverting to email-only admin would remove this security boundary and requires explicit review before launch.

# Screenshots

See [UI review and all captures](https://github.com/UncleChenna/wedding-app/blob/TICKET-030/docs/reviews/TICKET-030/README.md). Four themes × 375/768/1280, five states, plus all shared-showcase slices. QR/key images use a labelled public sample.

# UI checklist

The [item-by-item evidence](https://github.com/UncleChenna/wedding-app/blob/TICKET-030/docs/reviews/TICKET-030/README.md) records PASS/N/A/NOT VERIFIED. Physical iOS/Android authenticator scanning is outstanding; this is not an unconditional UI approval.

# Harness changes, if any

Browser checks now await the streamed sign-in redirect. Scoped MFA screenshot waits diagnose unfinished finite animations without weakening axe. Centralizing bounded animation diagnostics is a possible separate maintenance task; no hooks or policies changed.
