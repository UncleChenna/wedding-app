# Ticket

Ticket: TICKET-056

# Summary

The gate has to verify a guest's QR without the server. This PR adds the signing half of that contract. The server
signs a compact Ed25519 gate pass for an invitation. Anyone with the published public key can verify it offline.
Tampering, unknown keys and passes dated in the future are rejected. Key rotation is documented. The payload
follows the approved [ADR 0020](../decisions/0020-gate-pass-credential.md).

# Changes

- `src/modules/checkin/lib/gate-token.ts`: the format-1 pass. Shared with scanners, so it has no Node or server
  imports.
  - Zod payload `{v, kid, inv, ver, iat}`.
  - Canonical unpadded base64url, with any other spelling of the same bytes rejected.
  - A 512-character cap.
  - WebCrypto Ed25519 verification against a key ring.
  - Expected failures returned as values.
- `src/modules/checkin/server/signing.ts` (`server-only`):
  - Loads and validates `GATE_SIGNING_KEY_ID`, `GATE_SIGNING_PRIVATE_KEY` (PKCS#8, Ed25519 only) and
    `GATE_RETIRED_PUBLIC_KEYS`.
  - Signs with `node:crypto`.
  - Exports the public ring, current key first.
- `src/modules/checkin/server/public-keys.ts` and `src/app/api/gate-keys/route.ts`: `GET /api/gate-keys` returns
  the public keys, cached publicly for 5 minutes. It returns a generic 503 with `no-store` when keys aren't
  configured.
- `scripts/gate-keygen.ts` (`pnpm gate:keygen [kid]`): prints a new key pair as env lines.
- `.env.example`: documents the three variables, left empty.
- `docs/decisions/0021-gate-signing-keys.md`: key storage, publication and a step-by-step rotation and compromise
  procedure.
- Module README, ADR index, dated plan, handoff and ticket notes.

# Acceptance criteria and evidence

- [x] **Round trip and tamper detection.** `gate-token.test.ts` round-trips the payload. It rejects 1,000
      deterministic tampered tokens: string-character replacements, and single-bit flips in decoded payload and
      signature bytes. It also covers non-canonical encoding, malformed input, unknown key ids, forged
      signatures under a known key id, and the 600 s clock-skew limit.
- [x] **The private key is read only on the server.** `signing.ts` starts with `import "server-only"`.
      `signing-boundary.test.ts` fails if any other source file mentions `GATE_SIGNING_PRIVATE_KEY`, if the shared
      lib imports Node or server code, or if a `"use client"` file imports signing. `public-keys.test.ts` checks
      the endpoint body contains no private material.
- [x] **ADR with rotation steps.** ADR 0021 is in this PR, so this holds once the PR merges.

# Verification

- `pnpm exec vitest run src/modules/checkin`: 3 files, 27 tests passed.
- The pre-commit `verify:quick` gate passed: lint, typecheck and related tests.
- Key generator checked by hand: a valid key id prints the env lines; an invalid one exits 1 with a message.
- `pnpm verify` runs in `pnpm t:pr`; its result is recorded in the PR conversation.
- **Not verified:**
  - Verification on real scanner browsers (TICKET-057).
  - Production secrets (TICKET-125, TICKET-148).

# Risks and rollout

- No schema, dependency, CI or auth changes.
- Scanner browsers without WebCrypto Ed25519 support can't verify. TICKET-057 must detect and report this.
- Signing is unavailable until keys are configured in the deployment secret store, and nothing issues passes yet
  (TICKET-044, TICKET-183).
- To roll back, revert this PR. No data migration is involved.

# Screenshots

N/A: no UI. The new endpoint returns JSON only.

# UI checklist

N/A: no route, component, style or guest-facing copy changes. `/api/gate-keys` is a JSON endpoint for devices.

# Harness changes, if any

None.
