# 0018 — Draft event settings and append-only RSVP history

- Status: Proposed · 2026-10-27 · TICKET-025

The event has an approved date and policies but no confirmed venue time zone. A missing settings row returns typed draft defaults; it must never invent a UTC RSVP cutoff or enable ordering. A singleton primary-key check allows at most one stored settings row.

RSVP history is insert-only for ordinary SQL: a statement trigger rejects update, delete and truncate, and common runtime roles lose those grants. A restrictive invitation reference prevents silent cascading history loss. New tables retain RLS without browser policies. This does not defend against administrators who can alter DDL.

The 90-day retention policy still applies. TICKET-127 must provide deliberately authorized privileged maintenance for history purges; ordinary application writes cannot silently remove audit evidence. No deletion is performed by this migration. See the [approval packet](../reviews/TICKET-025/migration-approval.md) for proposed SQL and verification scope.
