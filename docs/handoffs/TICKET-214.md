# TICKET-214 handoff

- **2026-11-04 (unclechenna, claude):** ticket rules relaxed for parallel work.
  - `t:validate` allows a gap for a ledger-reserved id whose file isn't on develop; strict if the ledger is
    unreachable.
  - `t:claim <id> --ahead` and `t:move <id> in_progress --ahead` start while blockers are in progress, in review or
    blocked; a blocker nobody has started still refuses. `done` waits for every blocker.
  - **Tell the other collaborators** (Codex / divine and ihemegodsfavour8-lang): pull develop after merge to get the
    new rules.
  - **First use:** TICKET-088 (admin shell) can start `--ahead` while TICKET-032 waits for its owner's `t:move done`.
