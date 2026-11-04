# Ticket

TICKET-185

# Summary

Device-cookie lockout can be reset by replacing the cookie. This draft begins shared
network-based abuse protection for invitation/pass lookups and staff PIN attempts.

# Changes

Adds a keyed network identity helper and its tests. Only explicitly configured Vercel
ingress trusts its platform IP header. IPv6 /64 grouping, mapped IPv4 normalization
and a shared local identity prevent easy identity churn. Adds an atomic PostgreSQL
counter with database-clock expiry, bounded cleanup and separate scope/network keys.
Generated migration files await exact-path commit authorization and are not yet in
this PR. Adds the implementation plan and migration review.

# Acceptance criteria and evidence

Criteria remain unticked pending full review and required approvals. Atomic storage,
expiry and shared-household traffic pass isolated tests. Private GET/HEAD downloads
and pages, RSVP/party actions and staff PIN sign-in now enforce request budgets.
Denied requests return private retry guidance before sensitive work. Generated
migrations and proposed launch budgets await approval.

# Verification

Identity suite: initially failed for missing implementation; subsequently 12 passed.
Database suite: four cases pass, including 30 concurrent calls through two independent
pools with exactly five allowed. Two earlier runs timed out under Docker resource
pressure; unchanged tests passed after only this worktree's unused services stopped.
Repeat migration preserves counts; all 16 public tables have RLS enabled.
Quick verification passes lint/types/45 related tests (51 opt-in skips).
After endpoint integration, quick verification passes lint/types/24 affected tests
(five opt-in DB cases skipped); the explicit database suite passes all five cases.
Production build passes. New rate-limit HTTP/browser tests pass mobile and desktop
(four passes, 4.4s). Existing guest journey passes both (4.5s); existing staff PIN
journey passes both (9.5s). Full gate then passed format/lint/types but stopped at
three existing stop-hook tests: they reject the unapproved generated migration
journal before executing their fake verifier. Other unit results: 932 passed,
82 skipped. This is a failed gate, pending exact-path migration approval and rerun;
no hook/test was bypassed. Log: `artifacts/TICKET-185/full-verify.log`.

# Risks and rollout

No rollout yet. Rate budgets require synthetic-traffic review. Migration authorization
will be requested for exact generated paths. Shared NAT may group legitimate users;
limits must accommodate this. This helper does not stop attacks across many networks.

# Screenshots

Twenty-four retry screenshots: `docs/reviews/TICKET-185/screenshots/`, all inspected.
Guest denials now use a native themed document preserving HTTP 429/503, with no
private URL in its body and a no-JavaScript retry form. PIN messages use the existing
form; long waits are expressed in minutes. Downloads remain plain-text errors.

# UI checklist

See `docs/reviews/TICKET-185/ui-review.md`: visual, Axe, keyboard and tap-target
checks pass across four themes and three widths. Five final browser cases pass;
one duplicate visual matrix is intentionally skipped. Physical devices and native font-loading/shared-renderer exceptions remain unresolved.
The UI review is incomplete, and this PR remains draft.

# Harness changes, if any

None.

# Latest retry verification

Metric-matched fallback fonts and reserved text space keep the native retry page
stable while fonts load. A redundant decorative label was removed. Exact-zero CLS
passes light/dark at 375/768/1280 with font requests delayed 500ms. The complete
retry suite passes six cases (two duplicate mobile matrix skips), covering HTTP
privacy, cookie replacement, keyboard retry, Axe and all-theme layouts. Twelve
updated guest screenshots were inspected; PIN screenshots are unchanged. Production
build and quick verification pass, including nine related unit tests. Migration
authorization, approved budgets, device/native-renderer review and full verification
remain outstanding; this PR is still draft.

Production retry-page measurement: Lighthouse 12.6.1 mobile Performance 100/100/100,
Accessibility 100/100/100 and CLS 0 across three serial runs. All responses remained
429/no-store. The explicit error-page auditing option was used, and its 429 warnings
are retained in `docs/reviews/TICKET-185/performance.json`. This evidence covers the
retry page only and does not certify real phones or the normal invitation journey.
