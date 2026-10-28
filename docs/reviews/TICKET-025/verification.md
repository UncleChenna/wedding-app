# TICKET-025 verification

## 2026-10-28 — resumed from committed migration evidence

Authoritative branch/PR inspection found migrations already generated, committed and pushed in e72852a on 27 October; ignored exact-path approval record exists. CI40519769549 passed all required jobs on that commit. The previous approval-blocked ledger/handoff was stale. CLI resumed this claimed ticket in 2a6d462. Base develop is 763430841153fe7b8fdba68594e0b4af54d56adc. No generated artifact or schema was edited during this resumed verification.

Stopped completed TICKET-006 stack with backup retained before starting this ticket to avoid the verified Docker memory problem. TICKET-025 startup passed. Two guarded migrations exited0 with identical complete counts: four applied migrations, 12 public tables; RLS enabled on all12. Counts: check_ins30, event_settings0, guests248, invitations110, menu_items16, order_items36, orders18, rsvp_changes0, rsvps85, staff4, tables28, themes4.

The initial opt-in run exposed an incorrect raw Postgres date expectation (Date versus string); corrected the assertion to the exact Date value. Added a real Drizzle-backed getEventSettings regression covering both unset defaults and stored time/date/time-zone/cutoff fields inside a rolled-back transaction. All21 targeted tests passed (15 unit +6 database). Runtime-role mutation grants and update/delete/truncate rejection passed. Two deterministic local seeds yielded identical complete counts; all6 database cases passed again after reseeding, proving the history trigger was re-enabled. No fixture transaction data persisted.

Quick gate passed lint/types; its6 opt-in skips are not counted as database verification. Full t:pr verification remains the next gate. No production execution, RLS policy addition, history purge or schema change was performed in this verification session. PR44 remains draft until that gate succeeds; after review, the human merges and the CLI records done. TICKET-012 and other dependents must wait for confirmed merge/completion.

## Full gate and review — 28 October 2026

`pnpm t:pr TICKET-025` passed the full gate on87e19b1:420 unit passes/16 opt-in skips, production build success,415 browser passes/111 conditional skips in3.5 minutes, no retries. Six database tests were separately enabled and passed, including after repeatable seeding. CLI moved to in_review in474ed8a. PR44 targets develop and is ready for human review once final-head CI passes. No merge or production rollout performed. The current worktree remains available for review; dependencies remain blocked until confirmed merge and CLI completion.
