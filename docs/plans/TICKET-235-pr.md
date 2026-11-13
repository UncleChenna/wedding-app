# Ticket

TICKET-235

# Problem and result

On a fresh scanner visit the saved-record probe could run before worker/snapshot preparation and show a storage failure until manual retry. The panel now shows preparation copy, then refreshes automatically when scanner or snapshot preparation completes. A failed real read still shows preservation/retry guidance; no queue is reset or made writable by this UI.

# Changes and evidence

- Refresh after an in-flight early probe, retaining session generation/unmount guards and bounded preparation fallback.
- Emit completion notifications only after current scanner preparation or a validated snapshot read.
- Strengthen the merged TICKET-132 real camera regression: healthy saved records must appear without pressing retry. All five signed QR results, immutable observation checks and stopped camera tracks remain asserted.
- 23 focused unit tests pass, including initial preparation, overlapping completion, unmount and real unavailable storage. The new initial/readiness tests failed before the fix.
- Production build passes against develop207798dc. Mobile and desktop real camera cases pass without manual retry; the selected camera/manual run passes all four cases (35.3s).
- Evidence: `docs/reviews/TICKET-235/mobile/` and `desktop/`, synthetic guests only. The initial valid-result screenshot now already shows healthy saved records.

# Limits and rollout

No migration, authority, queue format, styling, theme tokens or new route. Existing staff-sized shared controls and entry/return navigation remain unchanged. Physical-device checks, fresh all-theme/768px matrices and Lighthouse/CLS certification remain release QA; this focused state repair does not certify them. Rollback is an application revert and does not alter retained records.

# Review

Independent bounded source/test review is clean. Generated manual-recovery screenshots were retained under ignored `artifacts/TICKET-235/manual-recovery/`; original TICKET-063 tracked evidence was restored after the run.
