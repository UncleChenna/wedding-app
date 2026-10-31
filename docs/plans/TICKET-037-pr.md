# Ticket

TICKET-037

# Problem and intended result

Personal invitations currently show basic names/date and the saved RSVP form. This ticket will complete the event-detail layout and reachable navigation using the approved warm copy.

# Changes so far

Claimed an isolated branch from develop7191d981 and recorded the implementation/verification plan. No product code changed. Resumed managed setup using the current generator; the old coordination checkout omitted the admin email template.

# Acceptance and verification

All acceptance criteria remain unchecked. Managed dependency installation, isolated Supabase startup and migrations passed. UI tests, production build, screenshots and performance measurements have not run for this ticket. This is an unfinished draft, not ready to merge.

# Remaining work and risks

Implement and test names/date/time/venue/dress code/map/RSVP sections in all themes and review widths. Venue/time/time zone/dress code are explicitly TBD; no invented event details. Resolve the returning-pass criterion against the unfinished signed-pass ticket044 before claiming completion. Keep physical-device testing release-blocking through201.

# Rollout and rollback

No application or database-schema change is included yet; only ticket-specific planning and handoff documentation. Review docs/plans/2026-10-31-TICKET-037.md for the planned checks. Rollback of this checkpoint has no product effect.
