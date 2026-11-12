# Ticket

Ticket: TICKET-184

# Summary

Saved private passes now expire at the configured retention deadline. Scanner cleanup preserves pending admission evidence, and partial queue eviction locks offline admission instead of treating lost events as a fresh empty journal.

# Changes

- Add a server-derived expiry header and reject expired own-pass saves. Sweep expired copies under their existing path locks and refuse stale copies even when deletion fails.
- Use venue calendar retention, with a conservative UTC+14 boundary when the venue zone is undecided. This never changes RSVP or scanner authority.
- Purge acknowledged receipt copies on scanner invalidation while preserving pending/rejected attempts and refresh barriers.
- Pair the journal with a separate cache identity marker; fail closed on partial eviction, conflicting markers and interrupted initialization. Adopt intact legacy journals without rewriting events.
- Extend actual emitted-worker and IndexedDB browser regressions, including capability isolation and known revocation.

# Acceptance criteria and evidence

1. Expired authority removes private lookup data and acknowledged receipts while preserving pending UUIDs: actual worker expiry regression.
2. Own-pass URLs stay isolated; known revocation and retention expiry cannot return old private copies: actual private-pass lifecycle tests and deletion-failure unit checks.
3. Queue-only loss makes status, readiness and admission unavailable; cache-only marker loss repairs only from intact evidence: actual storage and worker tests. Existing recovery advice remains unchanged.
4. No added dietary notes or credential material; docs explain lifecycle cleanup and retained evidence. TICKET-231 is the mandatory reviewed admin recovery follow-up and blocks release154. Normal expired credentials are never extended.

# Verification

- `pnpm verify:quick`: lint and types pass; 86 related unit tests pass.
- Focused shared worker and offline-pass route suites: 37 tests pass, including marker preservation during activation.
- Combined actual queue/store/private-pass browser suite: 36 pass. Dedicated private-pass Chromium/WebKit suite: 4 pass.
- Independent read-only review found no remaining blocker in expiry, purge, or identity guard.
- Integration with TICKET-180's worker upgrade protocol remains before final review. CI is pending; no database, full production build or physical-device result is claimed here.

# Risks and rollout

Legacy saved passes lacking an expiry header require another online save. An undecided venue zone can expire copies up to26 hours early. Cleanup happens on worker activity, not a guaranteed wall-clock wakeup. Complete loss of both identity namespaces is undetectable and cannot recover deleted evidence. Failed storage APIs cannot guarantee physical removal, but expired responses remain unreadable.

Do not clear site data while evidence is pending. Sync with valid authority or preserve the profile and escalate for reviewed admin recovery. The renewal fixture proves ordinary sync under fresh valid authority, not a production post-event recovery path. TICKET-231 must implement that path before release. Physical-device gates remain in TICKET-201/TICKET-138. No SQL migration or dependency change. Roll back only to code retaining these journal/marker guarantees; do not reset storage to recover a deployment.

# Screenshots

N/A: storage, worker and endpoint behavior; no page layout or rendered QR changes.

# UI checklist

N/A to new visual design. Existing recovery messages and page flows are retained. Physical-phone storage verification remains release QA; no device certification is claimed.

# Harness changes, if any

Existing queue browser test configuration includes the private-pass lifecycle regression; no CI checks, hooks or tests were weakened.
