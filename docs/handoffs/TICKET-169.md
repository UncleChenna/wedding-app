# TICKET-169 handoff

- **2026-11-01 (unclechenna, claude):** Drafted [ADR 0020](../decisions/0020-gate-pass-credential.md) and a
  12-row decision table in the ticket notes. The table covers:
  - the QR URL split
  - snapshot freshness
  - stale revocation
  - reissue and party-size changes
  - expiry
  - lost devices
  - clock skew
  - double entries from disconnected scanners

  **Status:** in progress, waiting on owner approval. Nothing is approved.

  **Next steps:**
  1. The owner marks each row approved or changed and fills in their name and the date.
  2. Update the ADR to match and set it to Accepted.
  3. Amend the PRD Journey 1 step 5 and the Security wording to say the QR is a read-only pass.
  4. Tick the acceptance criteria and run `pnpm t:pr TICKET-169`.

  **Environment:** the worktree's local Supabase failed to start because Docker is full of other stacks. This
  ticket is docs only and doesn't need it.
