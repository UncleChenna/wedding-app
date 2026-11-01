# checkin

Gate check-in: staff scan guest QR codes with the phone camera. Must work offline: queue scans on the device with a `client_event_id` and sync idempotently (`check_ins`). Routes: `src/app/(staff)/checkin`.

Gate passes (ADR 0020, ADR 0021):

- `lib/gate-token.ts`: the format-1 pass encoding and WebCrypto verification. It's shared with scanners, so it has
  no Node or server imports.
- `server/signing.ts`: Ed25519 signing and key ring loading. This is the only reader of the private key.
- `server/public-keys.ts`: the `GET /api/gate-keys` response.
