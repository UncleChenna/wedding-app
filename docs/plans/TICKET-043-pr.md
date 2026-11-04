# Ticket

Ticket: TICKET-043

# Summary

Draft preparation for administrator invitation revocation/reissue. Implementation
is not complete. The plan preserves immediate online rejection and the approved
limits of offline revocation.

# Changes

Claimed the ticket in an isolated branch from develop c3dd68f. Added an implementation
plan and handoff covering action authorization, token/version rotation, durable audit,
confirmation UI and offline snapshot behavior. No application or schema code yet.

# Acceptance criteria and evidence

All acceptance criteria remain incomplete. Existing status/version lookup primitives
were inspected; there is no general invitation lifecycle audit table. Dedicated
storage and migration ordering must be resolved before implementation is certified.

# Verification

Ticket-start commit checks passed. Locked dependencies and shared skills were installed.
Initial isolated database startup failed; no database behavior or feature test is
claimed. No production, real-device or scanner end-to-end verification occurred.

# Risks and rollout

PR89 owns migration0012. Avoid competing generated migration indices; settle integration
order before generation. New migration outputs require exact-path authorization;
no production application is authorized. This draft contains documentation only.

# Screenshots

Not applicable yet: confirmation UI is not implemented.

# UI checklist

Pending implementation and all-theme browser evidence; no UI completion claimed.

# Harness changes, if any

None. TICKET-215 carries workflow improvements separately.
