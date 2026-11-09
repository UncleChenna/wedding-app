# TICKET-128 handoff — 2026-11-09

Owner divine, agent codex. Branch/worktree `TICKET-128`.

Started ahead of active TICKET-027, based on its proposed ADR 0023. No edits to its
checkout, RLS, migrations or policies. Implementation and evidence are recorded in
`docs/plans/TICKET-128-pr.md`; contract is `docs/dietary-privacy.md`.

Local checks: 44 focused tests passed; quick lint/types and 45 related tests passed
(29 database tests skipped). No stack started. No external messages sent.

Remaining: independent review, full CI, integrate completed TICKET-027 and verify
its actual role-policy contract before marking acceptance/ready. Keep PR draft.
The bar/kitchen board payloads do not exist yet and must follow this contract in
their own tickets. Do not remove existing operational order notes: the form and
ORD-3/9 intentionally send them to kitchen/bar; private RSVP dietary fields are
separate. No guest/history/import fields are mapped to those operational notes.
