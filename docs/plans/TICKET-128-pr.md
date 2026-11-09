# Ticket

Ticket: TICKET-128

# Summary

Private RSVP dietary notes must not reach gate or bar consumers. This draft publishes
an executable field projection contract and applies it to existing gate-print and
station-alert consumers. It deliberately preserves ordinary order instructions
sent to kitchen/bar by the existing form, including “no ice”.

**Draft dependency:** TICKET-027 owns the RLS and station Broadcast policy. This
branch started ahead and must not merge or be marked complete before that contract
is integrated and independently verified.

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

- [ ] Gate/bar endpoint privacy: existing gate print/pass/snapshot consumers have
      field/response regression coverage. Bar/kitchen boards are still entry
      placeholders; TICKET-027 combined policy integration remains outstanding.
- [x] Executable contract published and used by actual consumers, with a documented
      requirement for future queries, subscriptions and exports to reuse or test it.

# Verification

- Initial failing test confirmed the missing projection implementation.
- Six focused suites: **44 passed** (role projection, gate print, pass SQL
  selections, credential response, admin gate reader, station alerts).
- `pnpm verify:quick`: lint and types passed; **45 related tests passed**, **29
  database tests skipped**. No skipped test is represented as verified.
- Full CI and TICKET-027 integration remain required. No database stack was started,
  no direct-key/RLS tests run, no external alert or message sent.
- Independent source review of `370eb171`: no blocking findings within this scope.
  CI run `42623840951` passed ticket validation, PR text and migrations; full
  verification and invitation browser checks were still pending at handoff.

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
