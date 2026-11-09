# Ticket

Ticket: TICKET-057

# Summary

Older scanner browsers could not verify a valid gate credential when Ed25519 WebCrypto was unavailable. The shared verifier now falls back to strict JavaScript Ed25519 verification, retaining the approved format-1 credential and public-key-only boundary. The scanner wrapper rejects expired trusted staff sessions without inventing token expiry.

# Changes

- Reuse the canonical 512-character payload parser, signed ASCII segment, rotating public key ring and ten-minute future-clock bound. Validate the exact RFC 8410 Ed25519 SPKI envelope and finite clock options.
- Add exact `@noble/curves@2.4.0`, with strict `zip215: false`; a native `false` result stays rejected. No new native binary or build-script permission was introduced. The generated lockfile and authorization record are covered by the user's standing instruction to complete implementation without repeated approval requests.
- Add `verifyScannerToken`, accepting the trusted staff-session/snapshot deadline calculated by its caller. This verifies a credential only; snapshot status/version, allowance and admission remain downstream checks.
- Add shared valid, forged, tampered, high-S noncanonical, future-clock boundary, removed-key, old-pass and expired-session vectors; run them in Node and both browser engines, including forced fallback.
- Add a dedicated database-free browser bundle/cache test and `pnpm test:gate`. Exact `esbuild@0.28.2` becomes an explicit development dependency (already present transitively). CI installs pinned WebKit alongside Chromium and runs this suite after the unchanged full verification gate. The dedicated suite does not add duplicate work to the normal mobile/desktop browser projects.

# Acceptance criteria and evidence

- Valid/tampered browser matrix: all four Chromium/WebKit × default/forced-fallback scenarios pass; each executes nine shared credential/policy vectors.
- Private-key boundary: actual browser bundle dependency graph excludes server signing imports; emitted bundle and the exact cacheable artifact contain neither private-key configuration markers nor the synthetic signing key bytes. Existing source signing-boundary tests remain enforced.
- Expiry contract: exact trusted session expiry fails closed; old format-1 passes remain signature-valid while a session is valid. No payload fields or snapshot maximum age are invented.
- Timings: 50 samples per browser/mode recorded in `docs/reviews/TICKET-057/automated-timings.json`. Playwright 1.64.1, Chromium 156.0.8078.4, WebKit 27.2, Node 24.15.0; browser entry built by esbuild 0.28.2. Chromium forced-fallback p95 0.7ms/max 1ms; WebKit p95 1ms/max 2ms. Default means native attempted, not proof that the engine used native crypto. Timer resolution permits zero readings. These are automated host measurements, never physical-device certification.

# Verification

- Regression first: four fallback/validation tests failed before implementation (`/tmp/TICKET-057-red.log`); then the new and existing signer/tampering suites passed 28 tests, including native-false and shared strict high-S rejection.
- `pnpm test:gate`: 4/4 passed with native-attempted and forced-fallback paths, real bundle execution, cache checks and timings. An initial WebKit launch failed because the pinned executable was absent; installing that exact browser resolved it without skipping tests.
- `pnpm verify:quick`: lint/typecheck pass; 68 related unit tests passed, one database test skipped because no database was started. The final staged quick gate runs again before publication.
- Full database-backed verification is delegated to required CI; no local full-gate pass is claimed. `pnpm build` passed. Required CI must pass on the final published head.

# Risks and rollout

No migration, production secret, deployed data or RLS change. Deploy/revert application code and generated dependency lockfile together. The standalone minified verifier test bundle is 490,739 bytes uncompressed (including schema validation and crypto); this is not a Next route payload measurement. Scanner shell caching/integration remains TICKET-059/108. Staff-session deadline must come from trusted session/snapshot data, never from a scanned QR. Snapshot revocation/version and admission checks remain mandatory.

Physical mid-range Android <20ms evidence and realistic physical iPhone/Android verification remain release-blocking TICKET-114. Actual-camera low-light rehearsal remains TICKET-163. No phone, camera, network or operator certification is claimed.

# Screenshots

N/A: no rendered product UI, QR appearance, route or styling changes. The browser harness executes the production verifier entry on an isolated synthetic page.

# UI checklist

N/A for visual design, layout, typography, motion, contrast, keyboard, sharing and image checks: no UI changed. Browser compatibility and public credential boundary are explicitly verified above; physical-device release gates are retained.

# Harness changes, if any

CI adds WebKit installation and the dedicated token browser suite without weakening existing checks. Browser artifacts live under ignored `artifacts/TICKET-057/`. Setup-generated PR-template drift is excluded from this ticket.
