# Ticket

TICKET-061 — Admit arriving guests with partial counts.

# Summary

A valid QR check previously recorded no arrival. Staff now choose how many household members are here and explicitly admit them. Admitting 2 of 4 leaves 2 available on the next scan. Only a committed receipt shows the approved Welcome message; replaying the same request shows a historical receipt and never grants another admission.

# Changes

- Same-origin, auth-first POST validates strict input and the actual signed pass before reading guest data. It locks the staff/device/credential and invitation, then reauthorizes after waits and immediately before writing.
- An immutable online event binds replay to its actor, invitation, source and count. Existing database triggers update canonical counters exactly once. No migration or counter rewrite.
- Count stepper defaults to remaining allowance. An eight-second timeout covers response headers and body; uncertain results preserve the exact request and prevent switching passes until retry resolves.
- Phone visibility changes stop camera/audio while retaining the pending admission component and event ID. Duplicate receipts expressly prohibit admitting again. Invalid/revoked/conflict/session-expired refusals use fixed red problem semantics.
- Initial Open camera appears above the idle viewfinder; receipts receive keyboard focus. Scanner stays free of Next server-action imports for the standalone offline bundle.
- CI adds SQL concurrency and authenticated partial-admission browser checks using its existing disposable PostgreSQL. Both TICKET-108 offline checks and its production asset generator remain unchanged.

# Acceptance criteria and evidence

- **2 of 4 leaves 2 remaining:** actual production browser on mobile and desktop submits 2, checks the canonical database counter, rescans and sees a default count of 2.
- **Idempotent request:** pure binding tests, concurrent SQL transactions and a browser response lost after actual commit prove exact replay creates no second event/increment. The browser also hides the phone before that lost response and proves retry keeps the same ID/count.
- **Over-admit refusal:** competing scanners cannot exceed current allowance; a browser form whose final place was consumed after its read gets a clear refusal. Revocation after the read also refuses the write.

# Verification

Previous integration evidence (superseded by the combined integration below): **143b4d637b8bfc4597f8f990a5085f2722454967** (verified TICKET-108 merge), integration commit **08d3cea6**. Sole conflict was CI; all steps from both parents were retained. Independent backend/UI review is clean, including the visibility, transport and semantic repairs. The reviewer inspected the original 144 state screenshots and all eight new integrated offline screenshots; the admission UI itself did not change during integration.

- Quick lint/types/related tests pass.
- Actual isolated PostgreSQL16 transaction suite: **5/5 pass** after integration,493ms. Tests include real invitation-lock waiting, post-wait expiry, concurrent replay and competing allowance. Synthetic append-only evidence retained; owned database stopped afterward.
- Production standalone asset generation and Next build pass.
- Integrated admission browser: **2/2 pass,34.3s**. First integrated mobile attempt timed out waiting for initial Valid pass; an unchanged serial rerun passes both projects. No timeout/assertion was relaxed.
- Integrated authenticated offline scanner: **2/2 pass,37.3s**. Actual PIN, private endpoint, offline restore, refresh, sign-out, all-theme axe and exact-zero load CLS pass.
- Existing camera recovery/lifecycle regression: **2/2 pass,1.2m** before integration; retained in final CI.
- Final serial full unit/coverage: **1764 passed, 190 conditional skips, 121.53s**; **98.30% lines / 98.51% branches**, unchanged per-file95% gate. Earlier integrated run had1763 passing tests and one unchanged image-test five-second timeout; the unchanged serial rerun passes, with both results retained.
- Final-head CI remains required before merge.

# Risks and rollout

No production database application or migration. Online admission only: persistent guest snapshots/outbox remain separate tickets. An expired/closed page requires the normal gate-lead reconciliation process; this ticket does not claim a durable offline outbox. Physical iOS/Android camera and event-condition checks remain mandatory TICKET-201 release gates. Reverting this application change disables the new write endpoint; existing immutable admission evidence must remain intact.

# Screenshots

`docs/reviews/TICKET-061/{mobile,desktop}/`:144 screenshots, six states × four themes ×375/768/1280 × two projects. `offline-mobile/` and `offline-desktop/` retain eight integrated shell screenshots and timings; `camera-mobile/` and `camera-desktop/` retain four camera regression screenshots. All fixtures are synthetic; no live guest token or dietary note appears in captures.

# UI checklist

| Check                | Result                                                                                                               |
| -------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Screenshots          | PASS; independently reviewed matrix and integrated offline screenshots, paths above.                                 |
| Tokens               | PASS; existing semantic/theme classes, no new colours/fonts/radii/shadows.                                           |
| Restraint/typography | PASS;18px staff body text, display headings and large count/receipt.                                                 |
| Mobile               | PASS; no horizontal overflow at375/768/1280, visible targets≥44px, initial camera button in375×812 viewport.         |
| Motion               | PASS; reduced-motion browser journey, no new animation or action delay.                                              |
| Keyboard             | PASS; count submission and receipt focus; labels associated; uncertain next-pass disabled.                           |
| Contrast             | PASS; axe0 in all themes/states; fixed green/amber/red with text/icons.                                              |
| Load/images          | PASS integrated shell CLS=0 in both projects. No new image/font output.                                              |
| Performance          | N/A guest Lighthouse target: staff-only screen under TICKET-217.                                                     |
| Copy                 | PASS; approved Warm Welcome only after commit; historical duplicate explicitly prevents readmission.                 |
| Shared components    | PASS; existing Card/Input/Button/StatusBadge; feature-specific workflow, no new general primitive.                   |
| Sharing/devices      | No guest sharing changes. Physical scanner devices remain unverified release gates in TICKET-201.                    |
| QR output            | N/A changed output; payload/signature/quiet zone unchanged. Real synthetic pixels tested, not physical cameras.      |
| Staff feedback       | PASS; labelled pass-check feedback retained; immediate committed receipt and safe failed-network recovery.           |
| Verification         | Local full unit/coverage and scoped production browser gates PASS; exact-head full CI remains required before merge. |

# Harness changes

Only additive CI test steps and documentation for the opt-in database-test flag. No threshold, hook, permission guard or existing test weakened.

## Hosted CI fixture repair

The first hosted invitation job failed because the two new fixtures unconditionally loaded `.env.local`, which is intentionally absent in CI. Both now use the injected `DATABASE_URL` directly and load the local file only when that variable is missing. Target identity guards and every assertion remain unchanged; no product code changed.

A stricter local proof rejected every `process.loadEnvFile(".env.local")` call while providing the isolated database URL: SQL **5/5 passed (816ms)** and production browser **2/2 passed (50.1s)**. Identical-layout regenerated screenshots were retained as ignored local artifacts; the independently reviewed images remain unchanged. Owned database stopped with data retained. Final CI must run again on the repair commit.

## Combined ordering integration and decode diagnostics — 2026-11-09

Final integrated base is `debc5b347a26b2f69f5ada2f69841bc66de6c858`, integrated as `f7ed299f`. The unchanged ordering migration is preserved, and its browser fixture remains last after all scanner/admission checks.

- Full serial unit/coverage: **1777 passed, 191 conditional skips, 81.14s**; **98.30% lines / 98.51% branches**, unchanged per-file 95% thresholds. Production generator/build and final lint/types pass.
- Isolated admission SQL **5/5 passed (477ms)**; shared request-budget SQL **6/6 passed (943ms)**. Authenticated offline scanner **2/2 passed (1.1m)**; ordering-last browser **2/2 passed (19.4s)**. Owned native database is stopped with its synthetic data directory retained.
- Initial QR decoding remains intermittently flaky: the first local admission run after each of the last two integrations timed out at the unchanged five-second Valid pass assertion. Hosted integration run `42715749631` also reported a desktop first-attempt timeout that passed its retry. These are not unqualified first-attempt passes, and no product fix or root cause is claimed.
- Added failure-only synthetic video-frame/resource diagnostics; the original assertion and error remain unchanged. Missing video or failed diagnostics cannot mask that error. No guest credentials, private keys or raw PINs are captured. Independent review of this delta is clean.
- With diagnostics, three repeats per project passed **6/6 (1.5m)**; a fresh production build followed by admission browser passed **2/2 (31.0s)**. No failure artifact was produced because these attempts passed. Timeouts, retries and assertions were not relaxed.
- Final diagnostic-head CI remains required before merge. Physical camera/device checks remain mandatory in TICKET-201; the intermittent synthetic decode behavior is disclosed for follow-up rather than represented as fixed.
