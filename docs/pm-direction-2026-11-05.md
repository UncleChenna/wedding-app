PM DIRECTION — BEGIN CONTROLLED IMPLEMENTATION

Use our previously supplied consolidated implementation brief as the product specification, including the subsequent UI-polish amendment. This message sets execution order and acceptance checkpoints; it does not replace or reduce that scope.

Do not restart completed work. Inspect and reuse it.

STATUS RULES
Track each phase separately as:

- Not started
- In progress
- Implemented locally
- Verified on the integrated commit
- PM accepted
- Externally blocked

You can update factual implementation/testing status yourself. Only mark “PM accepted” after my explicit acceptance. Passing checks does not automatically mean wedding-ready.

FIRST: PRESERVE OUR DECISIONS

Create or update a version-controlled decision register and requirements checklist from the full approved brief. Include:

- Individuals, families and groups; named members and per-person RSVP.
- Duplicate prevention without merging household members.
- Password-free private-link access, persistent device sessions, multiple household devices and revocation.
- Separate staff accounts, roles and admin two-step verification.
- Admin WhatsApp invitation batches and manually shared private links.
- Saved invitation numbers reused; WhatsApp optional for guests.
- Number-format validation; WhatsApp registration lookup remains provider-dependent.
- Household QR pass with individual arrivals.
- Table assignment at first arrival, reserving seats for confirmed members.
- Admin-approved extra guests, seating splits and capacity changes.
- Free food/drinks, household ordering and recipient-level items.
- Stock reservations, serving controls and independent food/drink service.
- Item-level preparation, cancellation, waiter claims and delivery.
- Alcohol recipient declaration and staff ID-check outcome before delivery.
- In-app notifications plus optional WhatsApp.
- Mobile-data/outage behaviour and manual operational fallback.
- Admin content controls, RSVP deadlines, reminders and change history.
- One-year retention, cloud backups, incident preservation and logged exports.
- Approved code-based envelope splash, countdown and guest navigation.
- Reusable UI components and design tokens; final visual polish later.

Carry over the detailed rules from the full brief, not just these headings. Mark genuine missing decisions explicitly instead of inventing them.

PHASE 0 — REPAIR AND INTEGRATE THE FOUNDATION

A. Development environment
Investigate the stalled iCloud-backed dependency cache and use a reversible repair within existing authorisation where possible.

If the protected-path hook still requires a human-created approval:

- Show the exact proposed approval JSON and relevant policy.
- Name the precise source and backup paths.
- Explain whether node_modules is a directory or symlink and whether it is shared.
- Explain the move, reinstall and recovery steps.
- Use a current, short expiry.
- Do not delete the original dependency directory or change dependency versions as part of the repair.

Do not fabricate the human record or bypass the hook. Continue independent work while this specific action is blocked.

B. Integrate TICKET-211 with current develop
Use a dedicated integration branch/worktree. Preserve the brother’s changes and existing local work.

Resolve the 16 conflicts by reviewing both intended behaviours, not by wholesale “ours” or “theirs” selection.

Pay particular attention to migration history:

- Establish which migrations are already applied in relevant environments.
- Preserve applied migration contents and ordering.
- Resolve migration numbering/journal/snapshot conflicts using the repository’s required tooling.
- Do not hand-edit applied migrations.
- Test both a clean database and a representative populated upgrade path.
- Request refreshed exact-path source approval only if required; do not assume earlier approval is still valid or covers new paths.

Run the RSVP integration checks against the resulting commit:

- Individual/family/group responses.
- Mixed attendance and dietary notes.
- Duplicate submissions and network retries.
- Concurrent edits and conflict handling.
- Deadline enforcement and reopening.
- History and legacy data preservation.

C. Verification reliability
Investigate the four-worker failures using logs and traces. Distinguish application defects, shared test state, server lifecycle issues and resource limits.

Do not increase timeouts, remove assertions, add blanket retries or skip failures merely to obtain a pass.

A documented worker limit may be appropriate if supported by evidence, but do not claim it explains the failures without establishing the cause.

Check CI on the resulting pushed commit. If permissions or repository configuration block CI, report the exact issue and the smallest owner action required. Do not weaken checks or change repository security settings.

PHASE 0 CHECKPOINT
Provide:

- Integration branch and full commit SHA.
- Conflict-resolution summary.
- Migration-history decisions.
- Passed/failed/skipped checks with relevant evidence.
- CI status for that commit.
- Remaining environment blockers.

Do not merge into shared develop or run hosted migrations at this checkpoint.

PHASE 1 — COMPLETE GUEST ACCESS AND RSVP END TO END

Build on the reconciled foundation and reuse TICKET-212.

Wire the session foundation into actual routes, cookies and browser behaviour. Cryptographic helpers alone do not complete guest access.

Deliver one complete journey:
Private invitation link → guest session → household members →
RSVP → confirmation → return visit → edit existing responses.

Verify:

- Persistent access after reload/browser restart within session lifetime.
- Multiple devices for the same household.
- No cross-household access.
- Link expiry and replacement.
- Revocation of sessions derived from replaced links.
- No duplicate people or RSVPs.
- Member selection does not change attendance.
- Existing saved WhatsApp number is not requested again.
- Optional WhatsApp setup for manually invited guests.
- Clear recovery and error states.
- No invitation tokens leaked into logs or third-party requests.

Provide a stable local preview URL and precise instructions to review the journey using synthetic fixtures.

Keep styling consistent with the approved provisional design and use reusable components/design tokens.

PHASE 1 CHECKPOINT
Provide the exact commit, test evidence, screenshots or a short walkthrough, and a list of remaining limitations. Mark it ready for PM review only when the whole journey works.

SUBSEQUENT PHASES — IN THIS ORDER

2. Staff identity and permissions, invitation administration, imports,
   manual links and WhatsApp sending integration.

3. Household QR check-in, partial arrivals, atomic seating, capacity
   controls, extra-guest approval and recovery workflows.

4. Menu/service controls, free ordering, stock reservations,
   recipient-level items, edits/cancellation and kitchen/bar queues.

5. Waiter claims, item-level delivery, alcohol verification,
   failed-delivery handling and waiter-help requests.

6. In-app notifications, optional WhatsApp notifications, admin overview,
   event content and reminder controls.
   Add notification foundations earlier where required by preceding phases.

7. Retention, exports, backups, restore rehearsal and operational
   outage/reconciliation procedures.
   Build audit history and permissions into each feature from the start.

8. Complete guest/staff/admin UI review and visual polish:
   approved envelope, typography, lighting/glow, transitions, photography,
   responsive layout, accessibility and reduced-motion behaviour.
   Keep staff controls readable and guest pages lightweight.

9. Private staging, integrated load/concurrency checks, real iOS/Android
   testing and usher/waiter rehearsal.

For each phase, implement frontend and backend together where needed to
demonstrate a complete usable journey. Add meaningful tests and submit a
phase report before declaring it accepted.

Keep working on independent authorised tasks while reviews or external
configuration are pending. Do not pause for routine implementation choices.

BOUNDARIES

- Existing product decisions remain authoritative.
- Final colours, real event details and assets remain configurable.
- Do not present prototype data as real wedding configuration.
- Do not send real guest messages as tests.
- Do not merge shared branches, purchase services or perform hosted
  migrations without the applicable authorisation.
- The destructive legacy upgrade bridge remains separately blocked
  pending its target-specific review and verified recovery plan.
- No bypassing hooks or creating human approval records yourself.

START WITH PHASE 0 NOW.
Return a concise blocker summary only where owner action is actually
required, and continue the remaining work.
