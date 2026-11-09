# Ticket

Ticket: TICKET-051

# Summary

Sharing an invitation now records the attempt and updates the guest list's first-send timestamp. The first attempt publishes a draft; later attempts preserve its RSVP response and original timestamp. Undo remains available even when sharing removes the invitation from the “Not sent yet” filter.

# Changes

- Add private `invitation_share_events` with channel, verified administrator, invitation version, prior state and Undo time. It stores no invitation link, recipient contact or message text.
- Authenticated actions lock the invitation, validate input, deduplicate request IDs and refresh both admin pages. Revoked or reissued links cannot be recorded through stale forms.
- Undo accepts only the same administrator's latest event within ten minutes. It preserves later RSVP changes and refuses later revocation/reissue. Database time governs expiry and Undo timestamps, avoiding clock differences between the app and database.
- WhatsApp/email intents, successful copying and resolved native sharing record attempts. Cancelling native sharing records nothing. Feedback explicitly distinguishes attempts from delivery; Undo does not recall messages.
- Undo survives filtered-row removal, returns keyboard focus to useful feedback after success, and disappears after link reissue. Preview sharing remains inert.

# Acceptance criteria and evidence

- **PASS — first/repeat sharing:** policy and persisted tests verify draft publication, first timestamp, repeated requests, RSVP preservation and revoked/stale rejection. Component tests cover all four channels.
- **PASS — sent filtering:** authenticated mobile/desktop tests share from the unsent filter, observe the row disappear, use Undo with the keyboard and observe it return.
- **PASS — cancellation/delivery semantics:** native AbortError leaves the persisted draft untouched with no event. An intercepted record failure after successful copying shows the failure without claiming sent status. External intents are described as attempts, never confirmed delivery.
- Integrated prerequisite TICKET-089 at `dc5bd61fc445d073a761f23112ac13396ba06b0b` over develop `360914b7`. This PR remains draft until that prerequisite merges and final review completes.

# Verification

- Focused unit/component suite: **24 passed**. Subsequent focus regression suite: **10 passed**.
- Actual isolated PostgreSQL tests: **5 passed**, including concurrent same-request deduplication, actor/latest-event Undo, expiry and revoked/stale rejection. The initial run exposed a real clock mismatch (4 passed, 1 failed); database-clock expiry/timestamps fixed it without weakening the constraint or assertions.
- Migration applied twice with identical row/migration counts: **21 applied migrations**. All **22 public tables retain RLS**. Isolated reset and repeat deterministic seeding produce identical counts. Evidence: `docs/reviews/TICKET-051/*counts*.txt`.
- Production build: **PASS**.
- Authenticated Playwright: **2 passed in 15.8s**, serial mobile/desktop. This includes real Auth/TOTP, failed-record disclosure, server-rendered list refresh, keyboard Undo, reissue and updated share link. Native share/clipboard APIs are simulated; external applications are not launched.
- **16 axe/overflow checks pass**: sharing and Undo states × four themes × two browser projects. Ten screenshots were reviewed.
- Final `pnpm verify:quick`: **PASS**, lint/types and 11 related tests; five opt-in tests skipped in that command were separately run successfully against PostgreSQL. Full verification is the required CI gate; it is not claimed as a local full-suite pass.

# Risks and rollout

Generated additive migration: `drizzle/0020_invitation-share-events.sql`, its snapshot and journal entry. Apply through the existing migration runner before deploying this code. It creates one RLS-enabled table with channel/version/time checks, a foreign key and an index; no existing data or access policy is rewritten. Reviewed SQL and isolated tests do not authorize production application. For application rollback, keep the additive table and deploy the previous application; do not hand-edit migration history or delete audit data.

A sharing attempt cannot prove delivery. Undo is bounded to the latest attempt and changes bookkeeping only. Physical phone/native-app behavior remains unverified under the existing release QA gates (TICKET-201); no device result is marked passed. No new paid service, secret, dependency or CI weakening is included.

# Screenshots

`docs/reviews/TICKET-051/screenshots/`: four themes in each browser project at 375px, plus the actual filtered-list Undo state. Example: [Undo at 375px](https://github.com/UncleChenna/wedding-app/blob/TICKET-051/docs/reviews/TICKET-051/screenshots/desktop-undo.png).

# UI checklist

- **PASS:** admin screenshots at375px; theme tokens, existing typography and shared Button/Input/Sheet retained; screenshots inspected; no horizontal overflow.
- **PASS:** all-theme contrast/axe in sharing and Undo states, labelled controls and non-colour feedback. Existing minimum44px controls retained.
- **PASS:** native modal cancellation, keyboard Undo, focus after removal, and link reissue refresh. Existing Sheet Escape regression is included through089.
- **N/A:** no new motion, photographs, fonts, QR rendering or guest-page layout; existing components and reduced-motion behavior are retained. Guest Lighthouse/QR requirements are unchanged.
- **Not verified:** physical iOS/Android native sharing and WhatsApp behavior; existing release gates remain mandatory.
- **PASS locally:** quick gate and production build; required full CI must pass on the final head before merge.
