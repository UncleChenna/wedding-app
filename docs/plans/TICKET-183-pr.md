# Ticket

Ticket: TICKET-183

# Summary

ADR 0020 decided that the gate QR opens a read-only pass link, separate from the personal RSVP link, but no such
page existed. This PR adds `/p/<signed-pass>`.

The page checks the Ed25519 signature, then the current server state, and shows one of six states:

- a valid pass with names, party size, table and the pass QR
- replaced
- revoked
- not attending
- invalid
- not ready yet

It has no form, never links to `/i/`, and keeps the pass out of caches, referrers, search indexes, metadata and
logs.

# Changes

- **`src/modules/checkin/lib/pass-eligibility.ts`:** pure rules from stored state to a pass state.
  - Revoked is reported first.
  - An older token version means replaced; a newer one means invalid.
  - A draft, a missing invitation or no attending RSVP each give their own state.
  - Only guest-safe fields are returned.
- **`lib/pass-url.ts`:** builds `/p/` paths and URLs only.
- **`server/pass-repository.ts`:** a Drizzle lookup of status, token version, RSVP count, table number and primary
  names. It reads no phone numbers, emails, notes or dietary data.
- **`server/resolve-pass.ts`:** rejects malformed passes without a lookup, reports missing keys as `unavailable`,
  verifies the signature before any database read, and logs only the state.
- **`components/gate-pass.tsx`** and **`src/app/(guest)/p/[pass]/page.tsx`:** the page, rendered on the server
  per request, with generic `noindex` metadata. Wording is provisional, in `gatePassCopy`.
- **`src/proxy.ts`:** `/p/:pass` gets `Cache-Control: private, no-store`, `Referrer-Policy: no-referrer` and
  `X-Robots-Tag: noindex, nofollow`.
- **`src/app/dev/pass`:** a sample-data preview of the valid state, listed on `/dev`.
- **`src/modules/shared/__tests__/qr.test.ts`:** now uses a real worst-case signed pass URL instead of a short
  placeholder.
- **Tests:** `resolve-pass.test.ts`, `gate-pass.test.tsx`, `e2e/gate-pass.spec.ts`, and the opt-in
  `scripts/__tests__/gate-pass.integration.test.ts`. `e2e/support/routes.ts` gains `/p/invalid` and `/dev/pass`.
- **Docs:** module README, dated plan, UI review with 24 screenshots, handoff, ticket notes.

# Acceptance criteria and evidence

- [x] **Read-only URL contract.**
  - The component test asserts no form, input or button and no `href="/i/…"` in any state.
  - The end-to-end test finds no form and no `/i/` link on a forged pass.
  - The only data source is the read-only lookup.
- [x] **Forged, expired, revoked, reissued and no-longer-eligible passes are rejected privately.**
  - The unit matrix covers missing, revoked, reissued (older version), never-issued (newer version), draft, RSVP no,
    unanswered and inconsistent-count cases.
  - The resolver tests cover forged, malformed, oversized and future-dated passes, and unconfigured keys.
  - "Expired" means a future-dated pass, a removed key or a deleted invitation; see the ticket notes.
  - The privacy test checks the valid result has no invitation id or raw pass.
  - The end-to-end test checks generic metadata and that no pass appears in meta tags. Logs record only `state`.
- [x] **Realistic QR length; online versus offline.**
  - The shared QR test decodes a real 278-character pass URL (version 12) in every theme.
  - The resolver test caps it at 65 modules.
  - `PassResolution` is documented as current-server eligibility that never claims admission.

# Verification

- `vitest run src/modules/checkin` plus `src/modules/shared/__tests__/qr.test.ts`: all passed (54 checkin tests,
  plus the QR suite).
- `pnpm typecheck`, `pnpm lint` and `pnpm build` passed. The build lists `/p/[pass]` with the same rendering mode as
  `/i/[token]`.
- End-to-end runs of `gate-pass.spec.ts`, plus `a11y-routes` and `overflow` for `/p/invalid`: 20 passed; the 4
  skips are desktop runs of mobile-only overflow tests.
- Visual: 24 screenshots, all inspected (`docs/reviews/TICKET-183/README.md`).
- **Local `pnpm verify` (through `pnpm t:pr`) failed on machine load, not on this change.**
  - Format, lint, types, unit tests and build passed. 684 browser tests passed.
  - 13 timed out in `order-preview`, `rsvp-preview` and `share-menu`. These suites don't touch the changed files;
    individual tests ran 7–15 minutes, and the whole run took 46 minutes against about 10 normally.
  - The load average was about 29, from other worktrees' verify runs and Docker stacks.
  - CI runs the identical `pnpm verify` on a clean runner and is the gate for this PR.
- **Not verified:**
  - The opt-in database integration test, not run because local Docker was unresponsive.
  - A live browser flow with a real signed valid pass.
  - Lighthouse.
  - WhatsApp in-app browsers and physical camera scanning (TICKET-201, TICKET-057).

# Risks and rollout

- No schema, migration, dependency, CI or RLS changes.
- Until gate keys are configured, every well-formed pass shows "Passes are not ready yet". Nothing issues passes
  yet; that's TICKET-044.
- TICKET-209's route registry will need `/p/[pass]` and `/dev/pass` added when both have merged.
- To roll back, revert this PR.

# Screenshots

See `docs/reviews/TICKET-183/`. It has the valid pass (`*-pass.png`) and the not-found state (`*-invalid.png`) in
ivory-gold, midnight-champagne, emerald-night and blush-sage at 375, 768 and 1280px.

# UI checklist

Recorded item by item in `docs/reviews/TICKET-183/README.md`.

- **Pass:** screenshots, tokens, typography, mobile, keyboard, contrast, load, copy (provisional), shared
  components.
- **N/A:** motion, staff feedback.
- **Not verified:** Lighthouse performance, WhatsApp and physical devices.
- **Partial:** QR scanning, decoded in software but not yet with real cameras.

# Harness changes, if any

None.
