# Ticket

Ticket: TICKET-128

# Summary

Private RSVP dietary notes must not reach gate or bar consumers. This change publishes
an executable field projection contract and applies it to existing gate-print and
station-alert consumers. It deliberately preserves ordinary order instructions
sent to kitchen/bar by the existing form, including “no ice”.

Integrated completed TICKET-027 RLS and TICKET-033 station broadcasts from develop
`275c42b85e46d94823c8d55df905b98ca9612281` in integration commit `89a2bdef`.
No policy change is introduced. Final integration commit `c2b6ad87` also includes
develop `3e75175ed67fbc49a20569e93a52f6e04b629239`, including the shared scan-sync
coverage repair; privacy, RLS and broadcast code is unchanged by that integration.

# Changes

- Shared role/field allowlists strip unknown fields, including nested guest records
  and histories. Only admin/kitchen guest projections can contain dietary notes.
- Gate print projection reuses the shared identity-only schema; existing pass
  SQL and credential-response schemas retain their narrower allowlists.
- Station alert formatting requires an explicit station and projects only table,
  quantities, menu names and the deliberately submitted operational instruction.
  The actual order adapter supplies only that data; no guest/history reads added.
- Adversarial tests exercise nested secrets, role denial, real pass query
  selections, printable rows and strict credential-response failure behavior.
- `docs/dietary-privacy.md` documents the exact boundary and downstream board,
  subscription and export obligations. No semantic text classifier is introduced.

# Acceptance criteria and evidence

- [x] Gate/bar endpoint privacy: existing gate print/pass/snapshot consumers have
      field/response coverage; all three station publishers reject private/nested
      and free-text fields. Real signed bar broadcasts contain only IDs/status,
      while deliberate order instructions remain persisted. Direct browser table
      access is denied for anon, authenticated and all staff-station claims.
      Future kitchen/bar board readers remain requirements of TICKET-076/077,
      rather than falsely certified nonexistent endpoints.
- [x] Executable contract published and used by actual consumers, with a documented
      requirement for future queries, subscriptions and exports to reuse or test it.

# Verification

- Seven focused suites: **58 passed** covering projections, gate print/pass/credential
  responses, admin gate reader, station alerts and actual station publisher boundaries.
- Seeded managed Supabase `wedding-ce69fdd2f8ea`: **12 RLS and four live Realtime
  tests passed**, including signed station tokens, forged/wrong-station rejection,
  reconnect/refetch, strict bar payload and preserved operational instructions.
- `pnpm db:check-rls`: all **23 public tables** retain RLS. Own stack stopped with
  its backup preserved after verification. No production database touched.
- Initial cold-service run: **14 passed, one failed** because first kitchen delivery
  exceeded the existing two-second limit. The serial rerun passed **16/16**, including
  the new bar test; no assertion or latency timeout was relaxed. This remains a local
  startup/performance observation, not a device/network performance certification.
- Final `pnpm verify:quick`: lint and types passed; **19 related tests passed,
  16 opt-in tests skipped**. Those opt-in tests passed separately in the explicitly
  enabled real Supabase run above.
- Combined-base `pnpm test`: **1,500 passed, 180 skipped, two failed**. Both failures
  were the unchanged pass-image tests exceeding their five-second limits while other
  worktrees ran coverage concurrently. Coverage thresholds passed (98.67% lines,
  99.31% branches overall). Quiet targeted rerun: **2/2 passed in 826 ms** without
  changing tests/timeouts. This is not presented as a fully green local suite.
- Post-integration `pnpm verify:quick`: lint and types passed; no changed source
  required related tests. Full CI against the final combined head remains mandatory.
- Independent final source review: clean, including the merged RLS/broadcast
  contracts and strengthened denial tests. Full exact-head CI remains required
  before merge. No external
  alert or guest message was sent. Future board/device/release checks are not certified.

# Risks and rollout

No migration, dependency, policy, data deletion or production operation. Rollback
is the code change only. Projection is not authorization: callers must resolve live
roles, limit rows to the appropriate station/household and not pass request roles.
Order `note` must only come from the submitted order, never RSVP/history/import
notes. The existing kitchen/bar form is intentionally not redesigned; arbitrary
user-entered instructions are not semantically classified as health data.

# Screenshots

N/A: no visual or copy change. Gate display and station alert wording stay the same.

# UI checklist

N/A: schema/projection code and tests only; no layout, component interaction, theme,
font, image, QR, motion or client boundary changes. Verification results are above;
no device or release certification is claimed.

# Harness changes, if any

None.
