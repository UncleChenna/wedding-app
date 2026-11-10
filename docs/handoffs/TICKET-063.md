# TICKET-063 active handoff

2026-11-10. Owner divine, codex, exact branch/worktree TICKET-063.
Base develop7533201c, integrated as e3721d0c after062's verified merge.065 remains
unmerged. No database started; coordinate the slot with065/root174.

Implemented pure name matching, strict HTTP boundary, authenticated POST adapter,
minimal name-only repository, manual observation and shared locked admission
intent. New receipts record input_method and replay refuses changing methods;
historical null receipts remain compatible with QR without rewriting evidence.
ManualGuestSearch and bounded client transport are implemented but not embedded
in the scanner yet. Cached selection stays read-only after reconnect, late query
responses are discarded, and uncertain manual admission keeps the exact intent.
Focused tests, scoped ESLint and TypeScript pass; no actual SQL/browser proof yet.
Reviewer found oversized household labels: now bounded first-two-primary labels
retain all full names for matching, with a long-name regression.
The scoped search coverage first found 87.5% branches; meaningful ranking,
duplicate-row, typo and fallback cases now prove 100% lines/branches (12 tests).
Three UI tests include blocking navigation during uncertain admission and exact
receipt retry. The real SQL extension and e2e/manual-checkin.spec.ts are prepared
but UNRUN. Do not claim their results or wire the browser runner before scanner
integration is complete. The fixture uses unique household names and preserves
append-only synthetic evidence; settings cleanup is limited to its own marker.

Next: integrate065 only after its verified merge. Use065's existing private-cache
authority/unsafeCache/denial boundary; do not bypass it with independent window
storage. Wire the manual UI through its existing session wrapper and preserve
staleness warnings. Add real SQL evidence for manual observation, same-id retries,
revoked/replaced races and method-conflict refusals. No signing or
invented QR credential. Manual is input_method, never a sixth verdict. Preserve
cached search as read-only until066's outbox implementation; offline reconnect
requires fresh authoritative selection before recording entry.

Read installed Next route-handler and server/client guides before wiring routes
and components. Follow ui-review; actual auth/SQL, denied-camera flow and every
theme/375/768/1280 still unverified. Old tickets/worktrees untouched.
