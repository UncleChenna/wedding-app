# Ticket

Ticket: TICKET-036

# Summary

Personal invitation URLs need unguessable tokens and server-side resolution. This draft adds tested token and resolver helpers; persistence and the personal route remain unfinished.

# Changes

- Claim and isolated worktree based on the merged invitation schema.
- Dated implementation plan and handoff documenting real HTTP 404 requirements and local database startup.
- 256-bit token generator, input validation, bounded atomic-reservation retries and guest-only invitation resolution.

# Acceptance criteria and evidence

All three product criteria remain incomplete: secure tokens with uniqueness retry, valid invitation rendering and neutral unknown/revoked 404s, and token-only guest URLs. Token/resolver helpers have 20 passing tests; Drizzle persistence, the real route and browser evidence remain required.

# Verification

203 tickets validated during the initial status commit. Plan and handoff pass Prettier. Locked dependencies installed. Existing Colima runtime started successfully after initial setup failed; isolated PostgreSQL became healthy. The first resumed Supabase startup failed. Stopped the completed TICKET-023 stack with data backup and retried TICKET-036 setup; this new attempt is running. Twenty new token/resolver tests pass after initial missing-module failures; targeted ESLint and Prettier pass. The pre-commit quick gate also passed after correcting strict test-array indexing. No full gate or database/browser route tests have run for this ticket.

# Risks and rollout

No deployment or schema change in this draft. Next.js streaming can turn a late not-found response into HTTP 200; real browser/request tests must verify the required 404 status. No shared database or other worktree is used. Revert these planning documents to roll back this draft.

# Screenshots

Not applicable yet: no UI changes implemented.

# UI checklist

Pending implementation; no UI completion is claimed.

# Harness changes

None. No hooks, checks or CI settings changed.
