# Owner-approved requirements — 2 November 2026

This is the verbatim user mandate. It supersedes conflicting historical PRD assumptions. Existing real event values must be reviewed rather than replaced by prototype values. Implementation status lives in `implementation-checklist.md`.

You are the lead engineer for my brother’s wedding app. ChatGPT and I have completed the product decisions below. Implement them in the existing project.

REPOSITORY
https://github.com/UncleChenna/wedding-app.git

Expected local workspace:
/Users/nt.photography/Desktop/WEDDING_APP

Previous audit:
WEDDING_APP_AUDIT.md

DESIGN REFERENCE
https://uchenna-adaora-wedding-preview.mellowhippo37.chatgpt.site/

This preview is a design reference and browser-local prototype, not the production backend. It may require the owner’s ChatGPT sign-in. If inaccessible, report that limitation and continue backend work; request exported design source/assets before claiming visual fidelity. Do not copy its simulated functionality into production.

YOUR MANDATE
Build the agreed application end to end. Preserve useful existing implementation and real data. Work through implementation and verification autonomously; do not ask me to approve every routine technical choice.

Do not add new product scope without identifying it as a proposal. Do not claim wedding readiness based only on automated test counts.

1. INSPECT THE CURRENT PROJECT FIRST

Read repository instructions and the audit. Inspect current branches, local modifications, migrations, architecture, authentication and tests.

The previous audit examined develop at:
02c992376250

At that time:

- Basic yes/no RSVPs persisted.
- Gate scanning, ordering, kitchen/bar boards and admin operations were incomplete.
- RSVP cutoffs were unenforced.
- Change history was missing.
- A migration failed against existing guest data.
- Hosted authentication, deployment and physical-device behaviour remained unverified.

These are historical findings, not assumptions about today’s code. Recheck them.

Preserve uncommitted work. Use an isolated implementation branch or worktree where appropriate. Do not overwrite changes, reset the repository or replace working architecture unnecessarily.

Create a requirements-to-implementation checklist showing:

- Existing and verified.
- Implemented but incomplete.
- Missing.
- Blocked by external configuration.
- Required before launch.

Then begin implementation; do not stop at producing a plan.

2. INVITATIONS AND HOUSEHOLDS

Support:

- Individuals.
- Families.
- Groups.
- Adults and children.
- Named members with separate attendance and dietary requirements.

An invitation belongs to an individual or household/group and can contain multiple people.

Provide two primary invitation-delivery methods:

A. Admin sends WhatsApp invitations

- Enter numbers manually or import them from a spreadsheet.
- Preview recipients and invitation content before sending.
- Select multiple invitations and send them as a batch.
- Send personalised messages with the correct private invitation link.
- Never expose recipients to one another through a group message.
- Record per-recipient queue, sending and delivery outcomes.
- Prevent unintended duplicate sends.
- Support correction and controlled retry of failed sends.
- Save the recipient number against the invitation so guests do not need to enter it again.

B. Admin creates a private link and shares it manually

- Create a distinct link for an individual or household/group.
- Copy the link for sharing outside the app.
- Offer guests optional WhatsApp number entry and notification opt-in.
- Guests without WhatsApp retain full access.

WhatsApp is optional for guests. In-app notifications are standard.

Use supported WhatsApp provider APIs. Verify provider capabilities, setup requirements, templates, costs and consent requirements. Record permission before automated sending.

Validate phone number format and country code. Do not label a number “confirmed on WhatsApp” unless a supported provider capability actually establishes that fact. Delivery failure alone is not proof that a number lacks WhatsApp.

Do not implement account scraping or unofficial WhatsApp automation.

Spreadsheet imports must preview changes, flag missing fields and possible duplicates, and require review before applying them. Do not merge people solely because they share names, email addresses or phone numbers.

3. SIMPLE, RELIABLE GUEST ACCESS

Guests open a private invitation link without passwords or mandatory account creation.

- Support persistent sessions on the same device, with documented expiry and revocation.
- Permit a family/group to use multiple devices.
- Scope every guest session to its authorised invitation.
- Never let changing a URL identifier expose another household.
- Do not expose names, phone numbers or other personal information in link tokens.
- Keep secrets out of analytics, application logs and third-party requests.
- Separate staff authentication from guest access.

A “Who are you?” selector can identify the member using a shared invitation. It must not create a new guest, change attendance, or count as age/identity verification.

Admin can revoke and replace invitation links:

- Old links stop working.
- Sessions derived from revoked links are invalidated.
- Existing RSVP, seating and order records remain intact.

Usher-assisted recovery:

- Find the correct invitation.
- Verify the guest through an appropriate staff workflow.
- Check in the appropriate members.
- Help restore guest access.
- Log sensitive recovery actions.

Entry QR passes and guest access links have different purposes. Do not make scanning an entry QR automatically grant household management access.

Implement rate limiting and abuse protection without making normal arrivals unnecessarily difficult.

4. RSVP AND DUPLICATE PREVENTION

Each invited person has exactly one current RSVP record for the event.

- A household representative can respond for multiple members.
- Mixed attendance is supported.
- Dietary requirements are stored per person.
- Returning visitors see existing answers and an Edit RSVP action.
- Repeated taps, refreshes, network retries and simultaneous submissions cannot create duplicate responses.
- Updates modify existing records and retain change history.
- Attendance totals count people, not links or submitted forms.

Enforce this using database constraints, transactions and idempotent request handling—not only disabled buttons.

For concurrent edits, prevent silent overwrites and provide a clear refresh/review path.

Extra guests:

- Guests submit a request.
- Show Pending approval.
- Admin approves or declines it.
- Pending requests do not count as confirmed attendance or reserve seating.
- Approved extra guests receive distinct member records and their own RSVP state.
- Apply equivalent approval controls to unapproved plus-ones arriving at the venue.

RSVP deadline:

- Admin configures the deadline in the event’s time zone.
- Enforce it server-side.
- Before the deadline, guests can edit.
- Afterwards, guests request changes for admin approval.
- Admin can reopen RSVP for one household or everyone.
- Reminders target invitations with outstanding responses and respect enabled channels.

Confirmation screen:

- Attendance and dietary details per member.
- Pending extra-guest requests.
- Access to the invitation and entry pass.
- Table assignment appears after check-in.

5. CHECK-IN AND SEATING

Use a household/group QR pass with member-level check-in.

When scanned:

- Show authorised invitation members.
- Usher selects who has arrived.
- Support separate arrival times.
- Repeated scans must not create duplicate check-ins or seat reservations.

At the first confirmed household arrival:

- Atomically assign a table with sufficient capacity.
- Reserve seats for all confirmed attending members.
- Later arrivals join that table.

Admin controls:

- Number of tables.
- Capacity of each table.
- Adding tables during the event.
- Table reassignment.
- Approved household splits when no single table fits.
- Approved last-minute guests.
- Reservation release and corrections through explicit logged actions.

Do not silently split households.
Do not overbook seats.
Do not reduce capacity below existing commitments without resolving the conflict.
Adding a table means adding real configured capacity, not inventing available seats.

Concurrent usher scans must not claim the same seats twice.

If a table changes while orders are active, keep staff delivery information current and clearly flag the change.

6. FOOD AND DRINK ORDERING

All food and drinks are free, including alcohol.
No checkout, card collection, payment requests or payment integration.

Ordering opens only when:

- The guest is checked in.
- Seating/delivery destination is valid.
- Admin has enabled the applicable service.

Guests choose:

- For me.
- For my household.

Only checked-in members are eligible recipients. Assign each item or serving to its intended recipient.

Show existing household orders to reduce accidental duplicates. Preserve per-recipient dietary information and configurable serving limits.

Admin can independently open, pause or close food and drink ordering.
Pausing new orders does not cancel existing orders.
Display clear service messages.

Menu controls:

- Items and categories.
- Availability and quantities.
- Relevant ingredients/allergen information.
- Optional per-person food and drink limits.
- Logged staff-approved exceptions.
- Sold-out controls.

Do not invent or guarantee allergen safety. Display confirmed information and flag relevant dietary notes to staff.

Reserve available quantities atomically when an order is accepted.
Handle simultaneous requests without overselling.
Release reservations for eligible cancellations.
Prepared items return to availability only through an explicit staff decision.

Guests may edit or cancel items until preparation starts.
After preparation begins, provide a waiter-help request instead.

Track food and drink items independently so one item’s preparation does not block eligible changes to another.

Use idempotency to prevent duplicate orders during retries.

7. ORDER STATES AND DELIVERY

Guest-visible progression:
Received → Preparing → Ready → On the way → Delivered

Track cancellation, unavailability and failed delivery explicitly, with useful reasons. Offer selection of alternatives where applicable.

Kitchen and bar have separate operational queues.

Waiter workflow:

- Claim a ready delivery atomically.
- Prevent two waiters claiming the same work.
- Display table, recipients, items and relevant dietary notes.
- Mark delivery item by item.
- Support food and drinks arriving separately.
- Record absent guests and unsuccessful deliveries.
- Admin can reassign work.

Only authorised staff can mark preparation and delivery outcomes.

“Request a waiter”:

- Associates the request with the guest/table.
- Shows acknowledgement and resolution.
- Combines repeat open requests so staff are not flooded.
- Supports escalation of unresolved requests.

8. ALCOHOL CONTROLS

The agreed event requirement is age 18+ for alcohol.
Confirm applicable venue/jurisdiction requirements before live service; do not silently assume this threshold is sufficient everywhere.

- Collect the recipient’s age declaration when relevant.
- Do not treat self-declared age as verification.
- Alcohol must identify its intended recipient, including household orders.
- Staff visually check acceptable ID at delivery.
- Prevent delivery confirmation without a recorded successful check.
- Record refusal or failed verification separately; never mark it delivered.
- Allow refusal of service with a reason.
- Do not allow a household representative’s check to approve alcohol for every member.

Record the check outcome, staff member and timestamp.
Do not store ID photographs or document numbers.
Avoid collecting exact birth dates when an age declaration and verification outcome meet the requirement.

9. NOTIFICATIONS

In-app notifications are standard.
WhatsApp is optional and based on recorded consent/preferences.

Important events include:

- RSVP confirmation and approved changes.
- Extra-guest approval/decline.
- Wedding reminders or important event changes.
- Table assignment or reassignment.
- Relevant order issues.

Detailed order progress remains visible in-app.

Staff receive live alerts appropriate to their roles:

- New kitchen/bar work.
- Ready deliveries.
- Waiter requests.
- Urgent operational issues.

Persist important notifications. Handle retries and duplicates.
A WhatsApp failure must never block RSVP, admission, ordering or delivery.
Do not assume WhatsApp is an offline fallback.

10. STAFF AND ADMIN

Roles:

- Admin.
- Usher.
- Kitchen.
- Bar.
- Waiter.

Allow multiple roles per person.

Individual staff accounts are required.
Use admin-controlled invitations/access grants.
Require two-step verification for admins.
Enforce permissions server-side.
Revoking staff access invalidates active access promptly.

Admin dashboard:

- Invitations and RSVP counts.
- Pending extra-guest and late-change requests.
- Arrivals.
- Reserved and occupied seats.
- Available table capacity.
- Active orders and delayed deliveries.
- Waiter requests.
- Stock and sold-out items.
- Separate food/drink service controls.
- Staff roles.
- Important activity history.
- Invitation sending outcomes.

11. EVENT CONTENT MANAGEMENT

Admin can update:

- Couple names.
- Date and time.
- Event time zone.
- Ceremony/reception venues.
- Programme.
- Dress code.
- Photos.
- FAQs.
- Relevant invitation content.

Allow admin to choose whether important changes trigger guest notifications.

Unconfirmed details display “To be announced.”
Do not use the prototype’s date as the real wedding date automatically.
The countdown must use the configured date/time/time zone, not the viewer’s local midnight.
If no valid date is configured, show a suitable placeholder.

12. APPROVED UI/UX

Guest style:

- Elegant envelope splash.
- Provisional burgundy and ivory palette.
- Wax seal and lace detailing.
- Invitation card revealed by the opening.
- Couple photography.
- Countdown.
- Clear RSVP controls.

Envelope interaction:

- Implement with code rather than requiring a video.
- Upward swipe advances the opening.
- Stopping holds progress.
- Downward movement reverses it.
- Tapping the seal provides an automatic opening alternative.
- At completion, show “Swipe up to RSVP.”
- Require a fresh gesture or tap to continue; the gesture completing the animation must not accidentally dismiss the result.
- Provide Skip intro, keyboard support and reduced-motion handling.
- Keep it separate from the main page, not a long scrolling hero.
- Do not obstruct routine wedding-day access with a mandatory repeated animation.

Wedding-day navigation:

- Invitation.
- My Pass.
- Food & Drinks.

Keep the table number and active order status easy to find.
Use existing approved photography as placeholders until real wedding photos are supplied.
Do not regenerate faces or add a rotating couple model.

Staff screens:

- Large controls.
- Readable text.
- Clear states.
- Strong contrast.
- Useful empty/error/offline states.

Admin:

- Desktop-friendly.
- Usable on phones.
- Clear operational priorities.

Colours remain configurable until confirmed.

13. MOBILE DATA AND OUTAGES

Design for mobile data and occasional outages.

- Keep assets and pages lightweight.
- Previously loaded invitation details and QR pass can remain viewable offline.
- Avoid exposing sensitive guest/staff information through overly broad caches.
- New orders are “Received” only after server acknowledgement.
- Show pending/failed submission honestly.
- Safe retry must not create duplicate orders or RSVPs.
- Show connection state clearly.
- Restore live state after reconnection.

Do not claim offline multi-device seating allocation is safe without a supported coordination mechanism.

Manual fallback:

- Ushers record arrivals through a documented fallback.
- One designated seating coordinator manages assignments during an outage.
- Staff reconcile records after reconnection, with duplicate/conflict review.
- Waiters can assist disconnected guests.
- Never silently replay stale stock, seating or delivery mutations.

14. DATA, HISTORY AND BACKUPS

Agreed retention:

- One year, with cloud backups.
- Document the retention starting point explicitly; use the event’s end as the proposed default unless existing agreed policy says otherwise.

Audit important actions:

- RSVP changes.
- Extra-guest decisions.
- Check-in corrections.
- Seating changes.
- Order transitions.
- Stock adjustments.
- Delivery and ID-check outcomes.
- Staff access changes.
- Invitation revocation/replacement.
- Exports and administrative overrides.

Logs should identify actor, action and time without leaking tokens or unnecessary sensitive data.

Restrict exports to admins and log them.
Implement expiry/deletion jobs and a defined backup expiry schedule.
Support authorised preservation of specific incident records with reason, scope and review/release controls.
Do not treat a preservation hold as indefinite retention of all guests’ data.

Use protected cloud backups and test restoration.
Document recovery procedures and external infrastructure dependencies.

15. ENGINEERING AND MIGRATIONS

Reuse the current stack where appropriate.
Use the server/database as the source of truth.
No browser-local simulation for production records.

Prioritise:

- Referential integrity.
- Unique constraints.
- Transactions for seating/stock/claims.
- Idempotent mutations.
- Explicit permitted state transitions.
- Permission checks.
- Concurrent-update handling.
- Reliable notification processing.
- Minimal sensitive-data exposure.

Fix the migration issue against existing guest data.
Test migrations on representative populated data, including families/groups.
Provide safe rollout and recovery instructions.
Never delete production data to make a migration pass.

Use realtime updates or a reliable equivalent with reconnection and reconciliation.

16. IMPLEMENTATION ORDER

A. Current-state verification, data model and safe migrations.
B. Guest/staff access and permissions.
C. Invitations, imports, RSVP and duplicate prevention.
D. Check-in and seating.
E. Menu, quantities, ordering and kitchen/bar.
F. Waiter claiming, delivery and alcohol controls.
G. Notifications and WhatsApp integration.
H. Content management, audit history, retention and backups.
I. Approved UI integration and complete responsive flows.
J. Integrated verification and private staging rehearsal.

You may adjust technical sequencing to reduce dependencies, but do not drop agreed requirements.

17. REQUIRED VERIFICATION

Test meaningful cases, including:

- Individual, family and group invitations.
- Mixed attendance.
- Multiple household devices.
- Shared contact information without false duplicate merging.
- Repeat submissions and concurrent edits.
- Deadline boundaries and time zones.
- Extra-guest approvals before and during the event.
- Partial household arrivals.
- Duplicate QR scans.
- Simultaneous table allocation.
- Households larger than available tables.
- Added tables and capacity changes.
- Table changes with active deliveries.
- Concurrent orders for the last available item.
- Retry after uncertain network completion.
- Edit/cancel racing with preparation.
- Independent food/drink progress.
- Competing waiter claims.
- Partial delivery and reassignment.
- Alcohol refusal and missing verification.
- Cross-household access attempts.
- Staff permission boundaries and revoked sessions.
- Lost/replaced links.
- WhatsApp opt-out, duplicates and provider failures.
- Reconnection and reconciliation.
- Migrations against populated data.
- Retention, preservation holds and backup restoration.
- Responsive, keyboard and reduced-motion behaviour.

Agree and document a realistic load target based on expected guest/staff numbers. Until numbers are provided, label test assumptions explicitly.

Run existing relevant checks and add meaningful coverage for new behaviour.
Report passed, failed, skipped and externally blocked checks separately.

18. DEPLOYMENT AND READINESS

Prepare private staging and deployment configuration.
Do not publicly launch, change audience, buy services or send real guest invitations merely to test.

Use synthetic fixtures and provider test facilities where possible.
If credentials, paid infrastructure, approved templates or owner action are needed, identify the exact blocker and continue independent work.

Before wedding readiness, require:

- Hosted authentication verification.
- End-to-end staging checks.
- Real phone testing on iOS and Android.
- Weak-network testing.
- Usher/waiter rehearsal.
- Backup restore verification.
- Confirmed event configuration.
- Operational fallback instructions.

Do not describe the app as wedding-ready while these remain outstanding.

19. HANDOFF AND PROGRESS

Maintain:

- Requirements checklist.
- Implementation notes.
- Test evidence.
- Outstanding launch blockers.
- Environment/configuration guide.
- Migration and deployment instructions.
- Staff operating and outage guide.

Give concise progress updates with completed work, findings and blockers.

At completion, report:

- What is implemented and verified.
- What remains incomplete or externally blocked.
- Branch and commit details.
- Test results and limitations.
- Exact owner actions required.
- Private staging status.
- Whether rehearsal and launch criteria are satisfied.

START NOW:
Inspect the repository and audit, establish the checklist, and begin the first implementation phase.
