# TICKET-189 — Visual ticket dashboard and conflict reduction

2026-10-21 · divine · codex · branch `TICKET-189` · base `38406b1`.

Built a local read-only dashboard with seven status columns, search, epic/owner/priority/label filters, theme switch, epic progress and native-dialog details/PR links. It is separate from the public wedding site. `pnpm t:dashboard` prints the generated file path; rerun and reload to refresh. Offline ledger fallback is clearly labelled.

Generated Markdown/HTML now stay under ignored artifacts. Tracked board/roadmap files are stable links. Reverse dependencies are computed in memory; status commands no longer sync unrelated tickets or stage whole ticket directories. New managed branches use freshly fetched develop and carry only a missing ticket definition. Shared/Claude instructions now require per-ticket handoffs; historical progress is preserved.

Verification: initial render side-effect regression failed before the fix. Final quick gate and full gate passed: 112 unit tests, production build, 21 smoke passes, 7 existing skips. Dashboard browser interactions and both themes at 375/768/1280 passed; eight screenshots inspected. Local-file browser navigation also passed. Review evidence: `docs/reviews/TICKET-189/README.md`.

Learned: a single prepend-only progress log still conflicts across parallel PRs; preservation alone does not prevent collisions. Avoid shared mutation in the first place. Static file statuses cannot determine live dependency completion; the ledger transition gate owns that rule. JSON imports need explicit import attributes in the Playwright Node runtime.

Next: human review/merge, then update older open branches once using ADR 0015 rollout instructions. All agents need the new CLI/skills before starting more work. Real-device Safari/Firefox and automatic GitHub-status reconciliation are not covered. No PR merged automatically.
