# Ticket

Ticket: TICKET-181

# Summary

Theme drafts must not change live invitations until an administrator publishes
valid light/dark snapshots. This adds separate draft storage and transactional
publication with AAL2 authorization and cache invalidation after commit.

# Changes

- Canonical schema, curated-font and named contrast validation before saving.
- Separate editable tokens and published snapshots in the themes table.
- Serialized publication revalidates both schemes and atomically updates snapshots,
  active flags and singleton selection. The active selection is one light/dark pair.
- Single-query published reads preserve preset fallback and never read drafts.
- AAL2 save/activate actions return safe errors; immediate cache expiry follows commit.
- Database rollback/concurrency tests and production HTML/preview browser evidence.

# Acceptance criteria and evidence

- AAL2 and validation: draft service and action unit tests cover denied, signed-out,
  enrolment/challenge and authorized boundaries, named validation failures and safe errors.
- Atomic publication: five isolated PostgreSQL tests pass, including failed final
  write rollback and two competing connections. Exactly one active pair remains.
  Cache invalidation ordering/failure behavior is covered by unit tests.
- Initial HTML/artifacts: dedicated browser test passes four custom-ID palettes on
  invitation/order routes at 375/768/1280 with JavaScript disabled. Preview PNG
  matches selected light background; invalid draft preserves invitation and PNG.
  Browser fixtures publish through SQL and wait for cache revalidation; they do not
  certify the immediate authenticated action-to-browser journey. Editor UI is TICKET-098.
- Remaining: integrate current develop migration history, full integrated gate,
  final UI/device/performance disposition. PR remains draft; no completion claim.

# Verification

2026-11-07 on base c9c9e66010ee773189477139d4f8b0d30cf481e1:

- Approved migration applied twice, identical counts, 16 public tables retain RLS.
- RUN_THEME_PUBLICATION_DB_TESTS=1: five PostgreSQL tests pass.
- verify:quick and production build pass.
- RUN_PUBLISHED_THEME_BROWSER=1, mobile project, one worker: one test passes,
  24 captures, eight Axe scans with zero violations, preview PNG checks pass.
- Full verify rerun is still in progress: format/lint/types/build and 1046 unit
  tests pass (101 opt-in skips); browser terminal result pending. Earlier unhealthy
  database run failed and was interrupted; historical evidence is in the handoff.

# Risks and rollout

Current migration0013 collides with merged outbox0013 and photo0014. Do not merge
this branch as-is. Concrete reconciliation proposal: docs/reviews/TICKET-181/base-update-proposal.md.
It requests regenerating the additive column as0015 and resetting only the owned
disposable database after a data-provenance check. Approval is pending.
No production application is authorized. Apply the final reviewed additive migration
before deployment; application rollback can retain its nullable column/snapshots.
No RLS-policy, CI or new dependency change is proposed by this ticket.

# Screenshots

24 reviewed captures: docs/reviews/TICKET-181/screenshots/, named
`t181-<palette>-<invitation|order>-<375|768|1280>.png`. Four palettes: ivory-gold,
midnight-champagne, blush-sage and emerald-night. No clipping or overlapping text
observed; normal existing typography, spacing and controls preserved.

# UI checklist

This ticket changes server persistence/readers, not component markup, CSS, fonts,
animations or editor controls. Existing routes are exercised to check published output.

- PASS: screenshots at all required widths/palettes, pre-hydration variables,
  no horizontal overflow at those widths, eight rendered Axe scans, approved copy.
- N/A: new token design, new shared components, new motion, staff feedback or photo
  rendering; none introduced. Canonical validation and existing token consumers retained.
- NOT VERIFIED: fresh Lighthouse95/CLS0 measurements, physical phone/WhatsApp,
  native keyboard/safe-area behavior, QR scans and authenticated editor activation.
  JavaScript-disabled reduced-motion captures do not certify interactive motion.
- Full verification: pending terminal browser result and later base integration.
- Disposition: CHANGES REQUESTED until remaining required checks or explicit preview
  exceptions are resolved. This is not a launch-readiness approval.

# Harness changes, if any

No harness changes. Handoff records the repeated tuple-inference mistake and proposes
readonly route tuples in a future testing-guide maintenance change.
