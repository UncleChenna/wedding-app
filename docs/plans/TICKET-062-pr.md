# Ticket

TICKET-062 — Log every scan with time, device, staff and result.

# Summary

Authenticated online pass checks will retain immutable dispute evidence without counting a read as an admission. Manual input provenance is separate from existing online/offline transport.

# Changes

- Add nullable bounded input method; preserve historical unknown provenance and transport/replay semantics.
- Log five outcomes with authenticated actor/device and observed/server times, zero people and no raw credentials.
- Bound request timestamps and enforce same-origin requests before evidence writes.

# Verification

In progress: pure mapping tests pass; database, privacy, browser and final CI evidence pending. This draft is not completion or release approval.

# Risks and rollout

Additive generated migration0027 only. No production application. Offline queue/sync and admin filters remain their own tickets; manual lookup UI is TICKET-063. Physical device checks remain release-gated.
