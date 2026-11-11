# Admin scan log verification

Extend the existing disposable authenticated admin journey, preserving its current
import/staff and dashboard suites. Add unique synthetic allowlisted admin addresses,
run the opt-in scan-log PostgreSQL suite, then run `e2e/admin-scan-log.spec.ts` for
mobile and desktop. The test signs in through existing real OTP/TOTP helpers.

It verifies denied unauthenticated navigation, five verdicts, unknown invitations,
combined offline/conflict/time/staff/device filters, separate timestamps, a persisted
resolution note and byte-identical original scan rows. It captures sanitized UI in
all four themes at 375/768/1280 with axe and target-size checks, plus keyboard filter
submission and clearing state. Automatic traces/video/screenshots remain disabled
to avoid recording authentication codes. Only explicit post-auth synthetic UI
screenshots are uploaded under `artifacts/TICKET-174/` for seven days.

No service, secret, account, timeout or existing check is removed or weakened.
This is covered by the user's standing authorization to implement and verify the
backlog, make repository decisions, and open/review/merge verified ticket PRs.
