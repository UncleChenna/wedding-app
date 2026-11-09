# TICKET-051 — sharing attempts and Undo

2026-11-09. Worktree created from develop; TICKET-089 remains an unfinished dependency, so keep the PR draft. Database has not started (089 owns the current browser/DB slot).

The managed start used configured owner `unclechenna`, agent `codex`, on an unowned ticket. The same actual agent continues this claim under explicit parent coordination; use `AGENT_OWNER=unclechenna` only for this ticket. Future claims use `divine`. No collaborator claim was changed.

Implemented the pure transition policy and seven passing unit cases after a failing missing-module test. First share publishes draft and sets sent_at; repeats preserve first timestamp and RSVP; revoked/stale links reject; Undo cannot reverse newer share/lifecycle state and preserves later RSVP.

Remaining: authenticated transaction with invitation lock, durable channel events and idempotent request IDs, bounded same-actor Undo, generated RLS migration and isolated verification, ShareMenu tracking and draft-sharing integration, native AbortError regression, guest-list integration after089, browser/axe/UI evidence, quick gate, draft PR. Do not interpret unit policy tests as persisted evidence. No schema migration generated yet.

External intent/copy means a sharing attempt, never delivery. Opening the menu alone must not publish. Native cancellation must not record. Undo should restore timestamp only when its event remains latest; never roll back a newer token/revoke/RSVP.

Update: integrated approved prerequisite089 head60cb0985 (includes043 migration0019); added persistence service/actions/schema and real ShareMenu/guest-list tracking with six passing component cases. Quick gate passed76related/87skipped before the final3componentcases. New persistence tests remain unrun. `db:generate` refused pre-bootstrap managed target, so no generated migration yet. DB slot order:089,166,then051; wait for parent coordination. PR write-up is `docs/plans/TICKET-051-pr.md`.

Latest UI correction: guest-list Undo now lives above filtered rows so first-share removal from the unsent filter cannot hide it. Reissue/revoke invalidates that affordance, and the Sharing page remounts ShareMenu by token version. Ten focused guest-list/component tests pass. Latest pre-correction quick gate passed79related/87skipped; commit hook will verify final correction.

Draft PR: https://github.com/UncleChenna/wedding-app/pull/116. Final focused suite24passed/5persistedskipped. Five opt-in DB cases now include concurrent request deduplication and Undo expiry. Pushed-head quick lint/types passed; clean-source unit step skipped. Migration and browser evidence remain outstanding.
