# Ticket

TICKET-085 — WhatsApp order alerts and board health

# Summary

The alert drain previously logged a message and marked it sent without contacting a provider.
This change adds disabled-by-default WhatsApp template sending and a visible staff-board warning
when an alert cannot be confirmed, while keeping order processing independent of provider failures.

# Changes

- Server-only configured Cloud API adapter, consent checks per attempt, three bounded retries for
  explicit transient rejections; ambiguous outcomes never automatically replay.
- Commit one whole-order batch reservation before external HTTP. Deduplicate shared phone numbers;
  preserve later queued messages and failed/uncertain attempts. No schema migration.
- Add station-scoped aggregate health to both boards, poll every15seconds while visible, reject
  stale response generations and stop after sign-out. No phone numbers/order notes in health output.
- Document deployment settings, changed delivery guarantees and rollback in ADR0022.

# Acceptance criteria and evidence

- Mocked provider rejection/retry, opt-out, partial failure and no-repeat behavior pass.
- Five isolated PostgreSQL cases prove actual committed claims and concurrent/repeated drain behavior.
- Staff-board warning production browser test passes with all-four-theme axe scans and375px
  screenshots; existing orders remain visible and actionable.
- Live phone receipt remains incomplete and requires TICKET-083. No real message was sent.

# Verification

25 focused tests pass, including five isolated database cases. Production build/TypeScript and the
375px staff-board browser check pass; all-four-theme axe scans have zero violations. Normal final
commit checks and hosted CI are pending. See docs/reviews/TICKET-085/verification.md for exact scope and limitations.

# Risks and rollout

Disabled until all five provider settings are configured. Requires an approved one-body-parameter
utility template and live account rehearsal. API acceptance is not phone delivery. A crash between
claim and HTTP can miss an alert; it remains visibly failed and orders remain on the board. Large
backlogs may exceed the original60second notification target; oversized single-order instructions
fail visibly without truncation. Disable provider settings/schedule to roll back; do not reset failed
rows to pending. No production database changes or new dependencies.

# Screenshots

Four reviewed mobile screenshots: `docs/reviews/TICKET-085/mobile-*.png`. Staff UI checklist and
limitations are recorded in `docs/reviews/TICKET-085/verification.md`. Draft remains open for the
live staff-phone requirement, which has not been performed.
