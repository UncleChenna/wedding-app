# 0026 — Resolve scan disputes without rewriting evidence

- Status: Proposed · 2026-11-10 · TICKET-174

Scan attempts are immutable operational evidence. An admin reviewing an offline
conflict needs to record a decision without turning that review into a new admission
or changing what the device originally reported.

Store resolutions separately in `scan_resolution_notes`, with an event foreign key,
server-derived admin UUID, server timestamp and a globally unique request UUID.
Permit only four resolution codes: reviewed, escalated, explained, follow_up.
Display their predefined wording rather than accepting free text that could contain
PINs, invitation secrets or dietary information. Notes never change scan results or
admission counters. Later notes preserve earlier decisions.

The application checks live admin two-factor access before each operation. The table
has RLS and no browser policies. A database trigger rejects UPDATE, DELETE and
TRUNCATE. A retry is successful only when its request ID is already bound to exactly
the same event, admin and resolution; a conflicting reuse fails. The admin page
displays the latest 20 notes per scan and explicitly states that older notes remain
in the audit record.

The local-only synthetic seed transaction temporarily disables this named trigger
alongside the existing audit guards, restores it before fixture insertion, and rolls
everything back on failure. This is never available through an application request.
Rollback of application code retains the additive table and audit evidence.

The scan page uses server-rendered GET filters and 25-row pages, ordered by received
time and ID. Reported time, received time, transport and input method are distinct
fields; manual entry does not become a sixth verdict. Filtering by unknown invitation
includes attempts that could not be associated with a valid invitation identity.
