# Ticket

Ticket: TICKET-107

# Summary

Guests could not reopen their entry pass without a network connection. After an accepted guest opens their personal invitation online, it now saves a minimal pass and confirms when storage succeeds. Reopening that exact link offline shows the QR, guest name, party size, table and last refresh time.

# Changes

- Add an authorized offline-pass endpoint using the existing RSVP/pass eligibility and signing boundary.
- Store only marked minimal HTML in a separate capability-keyed cache, with validated public fonts and existing theme tokens.
- Add a save-status hint to the real invitation's QrPass; previews and signed public pass links do not opt into private storage.
- Serialize refresh/removal and invalidate revoked, declined or replaced passes before replacement storage. Preserve copies during transient network failures, and use a generic fallback after eviction.
- Add worker security/race tests, isolated production browser coverage, screenshots and PWA lifecycle documentation.
- Add the physical offline-pass checks to release-blocking TICKET-201 without changing its status or releasing either deployment gate.

# Acceptance criteria and evidence

- Offline QR after first online visit: production browser test reopens the original link offline, decodes the SVG and verifies the Ed25519 signature, invitation ID and version.
- A second guest's link cannot expose the first guest's pass: browser A/B navigation and worker source/path/foreign-origin tests.
- Saved-copy label, last refresh time and revocation: browser checks the timestamp, reconnects after revocation and online decline, and verifies cache removal. Unit tests cover racing saves, changed versions, quota and tombstones.

# Verification

Base: develop `be0d656343ad3d31af0f904c3a8763c6f94dc598`.
Focused suite: 43 passing tests. Production build and dedicated offline browser flow pass.
Final full gate passed: ticket validation, formatting, lint, types, 783 unit tests (41 skipped), production build and 769 browser tests (165 skipped).
Three serial Lighthouse mobile runs: performance 99/100/100, accessibility 100 each, CLS 0 each. Offline browser CLS is also zero. Reports are local under `artifacts/TICKET-107/`; portable review evidence is in `docs/reviews/TICKET-107/REVIEW.md`.
Physical WhatsApp and iOS/Android scanning are not verified and remain release-blocking in TICKET-201 under the approved preview exception.

# Risks and rollout

No migration, dependency, RLS or protected generated-file changes. Deploy through the normal application workflow. Existing workers activate only after old controlled tabs close; no automatic skipWaiting was introduced. Browser eviction and storage denial can prevent offline availability, so screenshot-backup advice remains visible.

Expiry/logout/retention are still mandatory TICKET-184 work. If storage deletion and tombstone writing both fail, invalidation survives only for the worker lifetime; no durable deletion guarantee is claimed. A saved QR never guarantees admission.

Rollback the application commit to remove this feature; existing private cache data needs deliberate lifecycle cleanup under TICKET-184 and must not be assumed deleted by rollback. This branch shares invitation files with other pending PRs: integrate sequentially and rerun verification on the resulting develop base. Human merge only.

# Screenshots

All four themes at 375/768/1280: `docs/reviews/TICKET-107/<theme>/<width>.png` (offline) and `online-<width>.png` (online save hint). Review the saved-pass document and then reconnect after revoking the synthetic invitation using `pnpm exec tsx scripts/review-offline-pass.ts` in an isolated managed checkout with its disposable database.

# UI checklist

Detailed PASS/NOT VERIFIED/N/A evidence: [review](https://github.com/UncleChenna/wedding-app/blob/TICKET-107/docs/reviews/TICKET-107/REVIEW.md).
Automated contrast, keyboard, reduced motion, layout, QR signature and performance checks pass. Physical sharing/device/scan checks remain unverified and release-blocking; this is a preview review, not production UI certification. Staff feedback is not applicable.

# Harness changes, if any

No hooks, skills, CI rules or guardrails changed. The isolated review runner generates signing keys only in memory and cleans up only the synthetic fixture IDs it creates.
