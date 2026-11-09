# TICKET-051 — sharing attempts and Undo

2026-11-09. Worktree created from develop; TICKET-089 remains an unfinished dependency, so keep the PR draft. Database has not started (089 owns the current browser/DB slot).

The managed start used configured owner `unclechenna`, agent `codex`, on an unowned ticket. The same actual agent continues this claim under explicit parent coordination; use `AGENT_OWNER=unclechenna` only for this ticket. Future claims use `divine`. No collaborator claim was changed.

Implemented the pure transition policy and seven passing unit cases after a failing missing-module test. First share publishes draft and sets sent_at; repeats preserve first timestamp and RSVP; revoked/stale links reject; Undo cannot reverse newer share/lifecycle state and preserves later RSVP.

Remaining: authenticated transaction with invitation lock, durable channel events and idempotent request IDs, bounded same-actor Undo, generated RLS migration and isolated verification, ShareMenu tracking and draft-sharing integration, native AbortError regression, guest-list integration after089, browser/axe/UI evidence, quick gate, draft PR. Do not interpret unit policy tests as persisted evidence. No schema migration generated yet.

External intent/copy means a sharing attempt, never delivery. Opening the menu alone must not publish. Native cancellation must not record. Undo should restore timestamp only when its event remains latest; never roll back a newer token/revoke/RSVP.
