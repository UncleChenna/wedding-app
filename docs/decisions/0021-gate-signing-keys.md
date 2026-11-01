# 0021 — Gate pass signing keys and rotation

- Status: Proposed · 2026-11-01 · TICKET-056

**Context.** [ADR 0020](0020-gate-pass-credential.md) fixes the gate pass contract: a format-1 Ed25519-signed
payload `{v, kid, inv, ver, iat}` that scanners verify offline with public keys only. This ADR covers how the
signing key is created, stored, published and rotated.

**Decision.**

- **Format.**
  - The token is `base64url(JSON payload).base64url(signature)`: unpadded, canonical base64url (other spellings
    of the same bytes are rejected), capped at 512 characters.
  - The signature covers the ASCII payload segment.
  - Verification lives in `src/modules/checkin/lib/gate-token.ts`. It uses WebCrypto and has no Node imports, so
    TICKET-057 can run the same code on scanner devices.
  - Expected failures are returned as values: `malformed`, `unknown-key`, `bad-signature`, `issued-in-future`
    (more than 600 s ahead).
- **Signing.**
  - `src/modules/checkin/server/signing.ts` (`server-only`) is the only file that reads
    `GATE_SIGNING_PRIVATE_KEY`, a base64url PKCS#8 DER Ed25519 key, together with `GATE_SIGNING_KEY_ID`.
  - Keys are validated with Zod and `node:crypto` key parsing.
  - Missing or invalid keys are an error result; the app still starts.
  - A test enforces that no other source file reads the variable and that no client component imports signing.
- **Publication.** `GET /api/gate-keys` returns `{ keys: [{ kid, alg: "Ed25519", spki }] }`, with the current key
  first and then retired keys. It is cached publicly for 5 minutes. It returns 503 with `no-store` when keys
  aren't configured. The response never contains private material or guest data.
- **Key generation.** `pnpm gate:keygen [kid]` prints new env lines. The private key goes only into the
  deployment's secret store (Vercel environment variables, TICKET-148), never into a committed file, a log or a
  chat message. Local development keeps the variables empty unless a developer generates a throwaway pair.

**Rotation procedure.**

1. Run `pnpm gate:keygen k<yyyymmdd>` to create the new pair.
2. In the secret store, append the **old** key's `kid=spki` line, printed when it was generated or taken from
   `/api/gate-keys`, to `GATE_RETIRED_PUBLIC_KEYS`. Then replace `GATE_SIGNING_KEY_ID` and
   `GATE_SIGNING_PRIVATE_KEY` with the new pair.
3. Redeploy. New passes carry the new `kid`. Old passes keep verifying because their key is still published.
4. Make sure every scanner refreshes its key ring before the event (TICKET-065 caches it with the guest list).
5. Remove a retired key only after every pass signed with it has been reissued (TICKET-043) or the event has
   ended.
6. **Suspected compromise:** remove the compromised key from both variables immediately, rotate, reissue every
   pass and force-refresh the scanners. Passes signed with that key then fail with `unknown-key`.

**Consequences.**

- No new dependency is needed: Node 24 and current mobile browsers implement Ed25519 in WebCrypto.
- Older scanner browsers without WebCrypto Ed25519 support can't verify. TICKET-057 must detect this and report
  it, and TICKET-055 chooses the devices.
- `kid` lets an old and a new key overlap without breaking passes guests have already saved.

**Validation.**

- `src/modules/checkin/__tests__/gate-token.test.ts` covers:
  - the round trip
  - 1,000 deterministic tampering cases (string characters and decoded bytes in both segments)
  - malformed and non-canonical input
  - unknown keys, forged signatures and clock skew
  - rotation with a retired key, and its removal
  - key loading errors
- `signing-boundary.test.ts` enforces the private-key boundary.
- `public-keys.test.ts` checks the endpoint body and headers.
- Not yet verified: verification on real scanner devices (TICKET-057), and production secret setup
  (TICKET-125, TICKET-148).
