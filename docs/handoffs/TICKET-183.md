# TICKET-183 handoff

- **2026-11-01 (unclechenna, claude):** built the read-only `/p/<signed-pass>` page, following ADR 0020.

  **States:** valid, replaced, revoked, not-attending, invalid, unavailable.
  - The signature is checked before any database read.
  - Only the state is logged.
  - Metadata is generic, and the proxy sends `no-store`, `no-referrer` and `noindex` headers.
  - Nothing on the page can edit an RSVP or link to `/i/`.
  - `/dev/pass` previews the valid state.

  **Tests:**
  - Unit and component tests in `src/modules/checkin/__tests__`.
  - The shared QR test now uses a real worst-case signed pass URL.
  - End-to-end: `e2e/gate-pass.spec.ts`, plus `/p/invalid` and `/dev/pass` in the route list.
  - Screenshots and the UI checklist are in `docs/reviews/TICKET-183/`.

  **Not run:**
  - `scripts/__tests__/gate-pass.integration.test.ts`, which needs `RUN_INVITATION_DB_TESTS=1` and this worktree's
    database. Local Docker was unresponsive.
  - A live valid-pass browser flow, which needs keys and a database.
  - Lighthouse.
  - Real-device scanning.

  **Next:**
  - TICKET-044: show this pass's QR inside `/i/<token>` after a yes RSVP. Use `gatePassUrl` and sign with
    `signGatePass`.
  - TICKET-185: rate-limit invitation and pass lookups.

  **Coordination:** TICKET-209 (Codex) adds a route registry. When it merges, register `/p/[pass]` and `/dev/pass`
  in it.
