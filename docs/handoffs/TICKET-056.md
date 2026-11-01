# TICKET-056 handoff

- **2026-11-01 (unclechenna, claude):** Ed25519 gate pass signing, verification and public key endpoint built, as
  ADR 0020 specifies. Rotation is documented in ADR 0021.

  **Changed:**
  - `src/modules/checkin/lib/gate-token.ts`: shared, WebCrypto-only verification.
  - `src/modules/checkin/server/signing.ts` and `public-keys.ts`.
  - `src/app/api/gate-keys/route.ts`.
  - `scripts/gate-keygen.ts`, run as `pnpm gate:keygen`.
  - `.env.example`: `GATE_*` variables, empty.
  - ADR 0021.

  **Tests:** 27 checkin unit tests pass, including 1,000 tampering cases and the private-key boundary test.

  **Next:**
  - TICKET-183: the read-only `/p/<signed>` page, using `parseGatePass` and `verifyGatePass`.
  - TICKET-057: scanner verification, reusing `lib/gate-token.ts`. It must detect browsers without WebCrypto
    Ed25519 support.
  - TICKET-044: show the pass QR after a yes RSVP.
  - TICKET-125 and TICKET-148: put real keys into the deployment secret store.

  **Environment:** this worktree's local Supabase failed to start because Docker is overloaded. The ticket needs no
  database.
