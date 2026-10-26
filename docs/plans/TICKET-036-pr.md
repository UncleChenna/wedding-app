# Ticket

Ticket: TICKET-036

# Summary

Personal invitation URLs need unguessable tokens and server-side resolution. This draft tracks the implementation plan; no product functionality is delivered yet.

# Changes

- Claim and isolated worktree based on the merged invitation schema.
- Dated implementation plan and handoff documenting real HTTP 404 requirements and local database startup.

# Acceptance criteria and evidence

All three product criteria remain incomplete: secure tokens with uniqueness retry, valid invitation rendering and neutral unknown/revoked 404s, and token-only guest URLs. Implementation and tests are next.

# Verification

203 tickets validated during the initial status commit. Plan and handoff pass Prettier. Locked dependencies installed. Existing Colima runtime started successfully after initial setup failed; isolated PostgreSQL became healthy. Full Supabase setup is still running. No product tests or full gate have run for this ticket.

# Risks and rollout

No deployment or schema change in this draft. Next.js streaming can turn a late not-found response into HTTP 200; real browser/request tests must verify the required 404 status. No shared database or other worktree is used. Revert these planning documents to roll back this draft.

# Screenshots

Not applicable yet: no UI changes implemented.

# UI checklist

Pending implementation; no UI completion is claimed.

# Harness changes

None. No hooks, checks or CI settings changed.
