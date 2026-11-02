# TICKET-107 UI and behavior review

2026-11-02. Base: develop `be0d656343ad3d31af0f904c3a8763c6f94dc598`.
Route: an accepted synthetic invitation at `/i/<capability>`, online and offline.
Only isolated local fixtures and ephemeral signing keys were used.

## Checklist evidence

| Check                    | Result and evidence                                                                                                                                                                                                                                                                              |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Screenshots              | Offline 375/768/1280 in all four registered themes, captured by `e2e/offline-pass.spec.ts` and inspected. Files are `<theme>/<width>.png`. Online hint captures online-<width>.png also pass axe in every theme and were inspected; 24 screenshots total.                                        |
| Tokens                   | PASS: snapshot uses validated theme CSS variables for colors, fonts and radius, including existing QR ink/paper tokens; no new theme tokens.                                                                                                                                                     |
| Restraint and typography | PASS: one pass, one refresh action, display-serif heading, 16px body with 1.6 line height and constrained width. Inspected all twelve offline captures.                                                                                                                                          |
| Mobile                   | PASS for browser emulation: no horizontal overflow, safe-area bottom padding and minimum 44px button. No inputs or on-screen keyboard on the offline copy. Physical devices not verified.                                                                                                        |
| Motion                   | PASS: no animation in snapshot; reduced-motion browser checks run across themes.                                                                                                                                                                                                                 |
| Keyboard                 | PASS: visible focus and Enter-triggered refresh preserve the saved copy when offline. No dialog or form exists in the snapshot.                                                                                                                                                                  |
| Contrast                 | PASS: axe reports no A/AA violations across all twelve offline combinations. Text and iconography do not rely on color alone.                                                                                                                                                                    |
| Load and images          | PASS: offline measured CLS is zero after font readiness; online three Lighthouse runs report zero. QR has explicit viewBox/aspect ratio. Existing next/font public CSS/fonts are copied, with no new photo.                                                                                      |
| Performance              | PASS: online production personal route scores 99/100/100 performance and 100 accessibility in all three runs. Local reports: `artifacts/TICKET-107/lighthouse-personal-{1,2,3}.json`. These measurements precede worker-only version/tombstone hardening, which does not change the rendered UI. |
| Copy                     | PASS: approved entry-pass wording reused; stale-copy warning, UTC last refresh, screenshot fallback and storage success are explicit. No raw technical errors shown.                                                                                                                             |
| Shared components        | PASS: existing QrPass hosts the save hint; shared QR generation and theme serializer reused. Standalone cache document deliberately has no React hydration. No new general-purpose component to showcase.                                                                                        |
| Sharing and devices      | NOT VERIFIED: physical WhatsApp iOS/Android and standalone install lifecycle. TICKET-201 records these as release blockers under the user's preview exception. Generic OG metadata avoids guest-name sharing.                                                                                    |
| QR                       | PASS automated decode and Ed25519 signature verification of the saved SVG, exact invitation/version checks, existing four-module quiet zone and QR tokens. Physical iOS/Android scans NOT VERIFIED, retained in TICKET-201.                                                                      |
| Staff feedback           | N/A: guest-only pass; no scanner or staff feedback changed.                                                                                                                                                                                                                                      |
| Verification             | PASS: pnpm verify; 783 unit tests (41 skipped), build, 769 browser tests (165 skipped), validation/format/lint/types green. Log: artifacts/TICKET-107/verify-final.log.                                                                                                                          |

## Behavioral coverage

Forty-three focused tests cover server escaping and private headers, exact-capability matching, forged source/path rejection, A/B isolation, storage errors, revoked copies, token-version replacement and serialization of racing save/delete requests. The actual production-worker browser test covers initial save, offline reopen, refresh timestamp, isolation, reconnect revocation, online decline and eviction.

The browser test decodes and verifies the saved signed QR rather than comparing it byte-for-byte to a separately minted online QR: valid issuance timestamps can differ. No signature, ownership or version assertion was removed.

## Remaining release gates

Preview review only; not production UI certification. Physical-device checks remain mandatory in TICKET-201, and expiry/logout/retention remain mandatory in TICKET-184. If all storage writes fail, the worker masks a known-invalid copy in memory but cannot guarantee durable removal across a worker restart. Saved copies never imply current admission permission; scanner validation remains authoritative.

Existing workers wait for normal activation; closing old controlled tabs may be required before the new save protocol is available. No automatic skipWaiting was introduced.

Review disposition: APPROVE for preview review under the existing explicit device-QA exception; production release remains gated. Final dedicated browser run with both online/offline screenshot matrices passed in 9.8 seconds. No automated failures remain.
