# Ticket

TICKET-093 — Build the seating plan: tables and assignments.

# Summary

Draft foundation for the seating plan. Capacity calculations distinguish confirmed
replies from named guests awaiting a reply and do not count declined/withdrawn
households. Over-capacity warnings will remain advisory.

# Changes

Pure capacity policy, strict table/assignment input schemas and an implementation
plan. The scanner-display check is preserved in TICKET-060 with an explicit093
dependency;093 will verify current assignment through the existing guest pass.

# Acceptance criteria and evidence

Incomplete: table CRUD, assignment persistence, page/sheets, stale-write handling,
current pass checks and browser evidence have not been implemented yet.
Three focused policy/input tests pass after an initial missing-module failure.

# Verification

Quick lint, strict types and three policy tests pass. Database, browser, production
build and full CI evidence remain
pending. No finished UI or seating behavior is claimed.

# Risks and rollout

No schema/dependency change planned. Keep order history intact and capacity
warnings nonblocking. Draft has no production route or database effect.

# Screenshots

Pending UI implementation; currently no UI changes.

# UI checklist

Pending page and keyboard/all-theme browser verification. Scanner completion is
still a mandatory separate ticket, not certified by this draft.

# Harness changes, if any

Ticket dependency clarification only; no checks weakened.
