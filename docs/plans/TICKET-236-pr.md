# Ticket

Ticket: TICKET-236

# Summary

Final domain and photo decisions currently block implementing the already approved palette and invitation hero. Separate preview implementation from final publication approval, keeping all final requirements mandatory at both releases.

# Changes

- TICKET-014 uses the approved palette without a photo/domain dependency; independent screenshot review remains required. Final couple visual approval is explicitly retained in TICKET-008.
- TICKET-038 can use identified stock preview imagery without implying the subjects are the real couple. Existing image-format, crop and zero-CLS criteria remain.
- TICKET-099 preserves validated uploads and adds explicit stock/saved-photo semantics.
- TICKET-008 retains final >=2400px hero, square photo, both-partner rights and final visual approval. Only the already-approved palette criterion is checked.
- TICKET-146 records domain ownership/DNS evidence after purchase; TICKET-008 records the prior domain choice, avoiding a circular prerequisite.
- Both TICKET-154 and TICKET-176 directly require TICKET-008, alongside their existing domain and release gates.

# Acceptance criteria and evidence

All four criteria are satisfied by the seven definition changes. No affected ticket status, owner, agent, branch, PR, start/completion or reason field changed; a direct comparison against HEAD confirmed each field. Dependency validation passes.

# Verification

- `pnpm t:validate`: 232 tickets valid.
- `pnpm t:render`: ignored local snapshots rendered successfully.
- `pnpm verify:quick`: lint and types pass; no changed source files require unit tests.
- Independent definition review requested before publication.

# Risks and rollout

Documentation/dependency changes only. No runtime, database, account or deployment changes. Final photos, rights, couple visual approval and domain ownership are still outstanding; stock preview permission does not satisfy them. Existing stock asset is only 1600px wide and is explicitly not accepted as the final >=2400px hero. Revert this definition change to restore the former scheduling dependencies.

# Screenshots

Not applicable: no UI or image files changed.

# UI checklist

Not applicable to this documentation-only change. Future TICKET-014/038/099 implementations retain their UI requirements; this PR certifies no device, contrast, performance or final asset checks.

# Harness changes, if any

No harness implementation changes. Ticket dependency definitions are reconciled; the shared ledger is unchanged for the seven existing tickets.
