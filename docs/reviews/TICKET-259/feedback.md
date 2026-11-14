# Action feedback review

## Coverage

| Area                                                                                       | Feedback                                                                                                                                            |
| ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Admin sign-in, MFA and staff PIN sign-in                                                   | Result toasts; inline guidance/validation retained. PINs and MFA setup secrets never enter a toast.                                                 |
| RSVP, party/meal details, lost links and table selection                                   | Returned action messages; persistent confirmation/error text retained. Redirect destinations remain the durable success view.                       |
| Admin settings, invitations, staff, devices, menu, scan notes and alert contacts           | Shared action-result notifications; menu removal emits before its row disappears; draft deletion notifies on its redirect destination.              |
| Imports, sharing records, seating, theme drafts, photo uploads and recovery                | Completion/failure message notifications; previews, inline validation and confirmation summaries remain available.                                  |
| Guest ordering                                                                             | Both React and native HTML implementations notify on submission outcomes; server-confirmed receipt/status remain authoritative.                     |
| Kitchen/bar/host actions                                                                   | Toast only after server response; failed optimistic changes revert and show an error. Conflict is an already-updated notice, never a false success. |
| Push permission and saved pass image                                                       | User-triggered result notification plus durable explanatory text.                                                                                   |
| Scanner verdicts, automatic offline saving, queue sync, background polling, worker updates | Existing dedicated result panels, banners or update controls retained. Repeated polls do not create toast noise or obscure gate results.            |

## Confirmations

Menu removal, existing staff PIN reset, access removal, closing ordering and event closure require confirmation. Existing invitation lifecycle, seating deletion, import review and station cancellation protections remain. Event closure still requires its typed phrase and preserved-evidence checkbox. Confirmation preserves the actual form submitter, native validation and noValidate, and does not claim success.

## Notification behavior

At most three React notifications are visible; evicted timers are cleared. Success/info dismiss after six seconds. Errors remain until dismissed or displaced, with persistent inline recovery text retained. Native ordering displays one dismissible result at a time. Notifications use live regions, shared theme colors and 44px dismissal targets. Initial action state and unchanged background messages do not replay; repeated new action results can notify again.

## Evidence

- Independent source review completed; findings about false-success status mapping, redirect/unmount outcomes, seating feedback and form validation were fixed.
- Browser checks: four registered themes × 375/768/1280 widths, reduced motion; modal opening, Escape/focus return, confirmation, queue bound, zero horizontal overflow and axe checks passed. 24 screenshots in `artifacts/TICKET-259/`.
- Full verification: 2,159 unit tests passed, 237 database/environment tests skipped. Production build uses synthetic local settings; no real credentials or database mutations were involved.
- Main checkout typecheck passed after integrating the feedback-only patch while preserving existing local edits.
- Physical-device and authenticated live database mutations were not re-run. No database schema, auth policy or request budget changes.
