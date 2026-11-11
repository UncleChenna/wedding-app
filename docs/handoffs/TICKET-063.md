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
Follow-up receipt regression reproduced a post-commit expiry turning a receipt
into403. Fixed: search/read still reauthorize after I/O; admissions use the shared
locked transaction's pre-write checks and return its receipt unchanged, matching
QR behavior. Eight auth/boundary tests pass. Prepared lock-wait database test now
covers both QR and manual input; both database variants remain unrun locally.

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

## 2026-11-11 integration checkpoint (supersedes pending evidence above)

Merged develop3b6c04e7 as0e7cedbe and wired manual UI through the existing065
session/cache wrapper. Authoritative denial and terminal outcomes share the
unsafe-cache generation fence; cached search/selection is read-only until066.
Production build passed. Owned isolated native PostgreSQL35681 migrated and
seven real admission tests passed. Manual production browser passed2/2 in31s,
including committed-response loss/exact UUID retry, offline selection and camera
tracks ending on mode switch. Database is stopped with data retained; path marker
is /tmp/TICKET-063-postgres-path. Never touch068Supabase36181.
144 captures exist under docs/reviews/TICKET-063. All72mobile images reviewed;
desktop independent review pending. Root source review clean. Quick lint and24
related tests passed, but test-only required-window-property cast failed types;
fixed to optional guarded property, rerun pending. Hold broad suites until068's
coverage session54247 ends. Physical/performance release checks remain unverified.
Keep PR152 draft until065 closure proof and final exact-head CI/review complete.

Final quick now passes lint, types and24 related tests. Official full suite passed
2,009 tests with207 conditional skips; critical coverage98.82% lines/99.08%
branches. Heavy slot released to068. No source changed after the reviewed browser
run; only fixture typing corrected. Physical arm-length AC stays unchecked.
