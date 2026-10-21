# Wedding Website — PRD

Transcribed from `Wedding Website — PRD.pdf` (Oct 21, 2026, @Divine). The PDF is the original; this Markdown copy is
the linkable source of truth for tickets. If the two disagree, fix this file in a PR and note the change in the
ticket that needed it.

## Overview and goals

One website runs the guest side of the wedding end to end: it sends personal invitations (IVs) with a QR code,
checks those codes at the gate, and lets seated guests order food and drinks from their table.

**Problem.** Paper IVs get copied or forwarded, gatecrashers are hard to spot at a busy entrance, and servers get
pulled in every direction once the reception starts.

**Goals**

- Every guest gets a unique, non-guessable IV that can be checked in seconds at the gate.
- Only valid, not-yet-used IVs get in; each IV admits exactly the number of people it was issued for.
- Guests order meals and drinks from their phones; kitchen and bar staff see a live queue by table.
- The couple can see RSVPs, arrivals and orders on one dashboard.

**Out of scope for v1:** gift registry, photo sharing, livestream, and any payment flow: all food and drink is free
to guests. These can follow later.

**Note on "bar code".** This PRD uses QR codes rather than classic 1D barcodes: every modern phone camera reads them
natively, they hold a full link, and they scan reliably off a phone screen in low light.

## Users and roles

Five roles, each with its own view; only guests use the site without logging in.

| Role                  | Who                                     | What they do                                                          | Access                                |
| --------------------- | --------------------------------------- | --------------------------------------------------------------------- | ------------------------------------- |
| Admin                 | The couple (and optionally the planner) | Manage guest list, send IVs, assign tables, set menu, watch dashboard | Email login + 2FA                     |
| Guest                 | Invited guests and their plus-ones      | Open IV, RSVP, show QR at the gate, order from the table              | Personal IV link, no password         |
| Gate staff            | Ushers or security at the entrance      | Scan IVs, see valid / invalid / already used, admit the party         | Staff PIN on a dedicated scanner page |
| Kitchen / bar staff   | Caterer and bar team                    | See incoming orders by table, mark them preparing / served            | Staff PIN on the orders board         |
| Table host (optional) | A waiter per section                    | See orders for their tables only, mark delivered                      | Staff PIN, filtered view              |

## User journeys

A guest touches the site three times: when the IV arrives, at the gate, and at the table.

### Journey 1: Receiving the IV and RSVP

1. Admin adds the guest (name, phone/email) and clicks Share, then picks WhatsApp, Email or Copy link.
2. Guest receives a WhatsApp message with a personal link, e.g. `oursite.com/i/8fK2…`.
3. The link opens a digital IV: names, date, venue, dress code, map, and an RSVP form.
4. Guest confirms attendance, adds their tag-alongs by name and picks meals. They can come back and change this
   until the wedding day.
5. On confirming, the page shows their QR code with Save to Photos / Add to Wallet and a downloadable PDF. The same
   link always shows their QR, so on the day they can reopen it from the WhatsApp chat.

### Journey 2: Check-in at the gate

1. Gate staff opens the scanner page on a phone or tablet and enters the staff PIN.
2. Guest shows the QR (phone screen or printout).
3. Scanner shows one of three results within 1 second:
   - **Valid (green):** guest name, party size, table number. Staff taps Admit and enters how many people arrived.
   - **Already used (amber):** who was admitted, when, by which device. Staff escalates.
   - **Invalid / not found (red):** staff refers the person to the couple's contact.
4. If a guest has no phone, staff can search the list by name and check them in manually.

### Journey 3: Ordering from the table

1. Every table card shows the same QR code, linking to `oursite.com/order`.
2. Guest scans it, types their table number and picks from the menu: meals, drinks, quantities, a short note.
3. Guest submits; the order appears instantly on the kitchen/bar board, routed by type (food to kitchen, drinks to
   bar), and a WhatsApp alert goes to that station's lead.
4. Staff move it through Received, Preparing, Served; the guest's page updates live.
5. Limits stop abuse: e.g. max open orders per table and a cooldown between orders.

## Functional requirements

Four modules; Must items are the minimum for the wedding day, Should and Could follow if time allows.

### Invitations and RSVP

| ID    | Requirement                                                                                                                                                                                                                                                                                                                                                                                                       | Priority |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| INV-1 | Admin can add guests one by one or import a CSV (name, phone, email, party size, side, table)                                                                                                                                                                                                                                                                                                                     | Must     |
| INV-2 | Each IV gets a unique random token (at least 128-bit) and a QR code that encodes the IV link                                                                                                                                                                                                                                                                                                                      | Must     |
| INV-3 | Each IV has a Share button that opens a menu: WhatsApp (opens WhatsApp via a wa.me link, straight to the guest's chat if their number is saved, with a pre-written message and the IV link), Email (opens the mail app via mailto: with subject and message filled in) or Copy link. On phones the native share sheet is offered too. Sharing marks the IV as sent. No WhatsApp Business account or paid provider | Must     |
| INV-4 | Guest RSVP: attending yes/no, then the guest adds their tag-alongs by name (up to a limit the admin can set per IV), with a meal choice and dietary notes for each person                                                                                                                                                                                                                                         | Must     |
| INV-5 | QR shown after RSVP yes; downloadable as image and PDF; resend link on request                                                                                                                                                                                                                                                                                                                                    | Must     |
| INV-6 | Guests return to the same link to edit their RSVP and tag-alongs any time until the wedding day, when it locks; admin sees each change with a timestamp                                                                                                                                                                                                                                                           | Must     |
| INV-7 | Admin can revoke or reissue an IV; the old QR stops working immediately                                                                                                                                                                                                                                                                                                                                           | Must     |
| INV-8 | Reminder list: admin sees who hasn't RSVP'd and re-shares their IV through the same Share menu, with a pre-written reminder message                                                                                                                                                                                                                                                                               | Could    |

### Gate check-in

| ID    | Requirement                                                                                                                                                                  | Priority |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| CHK-1 | Scanner page uses the device camera to read the QR, no app install                                                                                                           | Must     |
| CHK-2 | Result in under 1 second: Valid, Already used, Invalid, Revoked, Not RSVP'd                                                                                                  | Must     |
| CHK-3 | Partial admission: an IV for 4 can admit 2 now and 2 later; it is "used" only when the allowance is reached                                                                  | Must     |
| CHK-4 | Manual search by guest name for people without their QR                                                                                                                      | Must     |
| CHK-5 | Every scan is logged: time, device, staff PIN, result                                                                                                                        | Must     |
| CHK-6 | Works with no signal at all: guest list cached on each scanner, QR signature verified on the device, check-ins queued and synced when signal returns, double entries flagged | Must     |
| CHK-7 | Several scanner devices at once, check-ins visible across all devices within 2 seconds                                                                                       | Should   |

### Table ordering

| ID    | Requirement                                                                                                                                | Priority |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| ORD-1 | One generic QR, the same on every table card, opens the order page; the guest types their table number, checked against the list of tables | Must     |
| ORD-2 | Menu with categories (meals, soft drinks, alcoholic drinks), photos optional, items can be marked sold out live                            | Must     |
| ORD-3 | Order: items, quantities, note, table; confirmation screen with live status                                                                | Must     |
| ORD-4 | Orders routed to kitchen or bar boards, oldest first, with sound alert on new orders                                                       | Must     |
| ORD-5 | Staff update status: Received, Preparing, Served, Cancelled                                                                                | Must     |
| ORD-6 | Abuse limits: max open orders per table, cooldown, per-item quantity cap                                                                   | Must     |
| ORD-7 | Ordering opens and closes on admin command (e.g. only after the couple's entrance)                                                         | Should   |
| ORD-8 | No sign-in or IV check: anyone sitting at a table can order for it; ORD-6 limits stop misuse                                               | Must     |

#### ORD-9 · WhatsApp order alerts (Must)

Every new order also sends a WhatsApp message to the kitchen or bar lead, e.g. "Table 12: 2 x chicken, 1 x water.
Note: no pepper."

Sending automatically needs an API, so alerts (only alerts, not IVs) go through the WhatsApp Cloud API or Twilio from
one dedicated number to staff who have opted in. When busy, alerts batch per station every 60 seconds so phones
aren't flooded. The board stays the source of truth: if an alert fails, the order is still on the tablet.

### Admin dashboard

| ID    | Requirement                                                                                                | Priority |
| ----- | ---------------------------------------------------------------------------------------------------------- | -------- |
| ADM-1 | Guest list with RSVP status, filters, export to CSV                                                        | Must     |
| ADM-2 | Seating plan: assign guests to tables; print table cards with the table number and the one shared order QR | Must     |
| ADM-3 | Live counters: invited, RSVP'd yes, arrived, orders open / served                                          | Must     |
| ADM-4 | Menu editor and staff PIN management                                                                       | Must     |
| ADM-5 | IV design editor (photo, text, colours) with preview                                                       | Should   |

## Non-functional requirements and security

The gate is the riskiest moment: it must be fast, work on bad venue Wi-Fi, and resist shared screenshots.

### Security

- **Unguessable tokens.** IV tokens are random (not sequential IDs), so nobody can generate a valid QR by guessing.
- **Screenshot sharing.** A forwarded QR still works once, so the defence is single use per seat: the scanner shows
  the guest's name and "already used" with the time of first entry. Optionally show a guest photo uploaded at RSVP.
- **Signed QR payloads.** The venue signal can't be relied on, so the QR carries an Ed25519-signed token that every
  scanner verifies without the server. Scanners hold only the public key, so a lost device can't mint IVs.
  Check-ins reconcile on reconnect.
- **Staff access.** Scanner and order boards need a PIN; PINs expire after the event. Admin uses 2FA.
- **Rate limits** on IV lookups, order creation and PIN attempts.

### Performance and reliability

- Scan to result under 1 second on 4G; order to board under 2 seconds.
- Sized for 200-300 guests with headroom to 350: 3 scanners, about 30 tables ordering at once.
- Fallback: printed guest list at the gate, exported the morning of the wedding.

### Connectivity plan (signal unknown)

- Bring a 4G/5G router with an external antenna (and a backup SIM on another network); print its Wi-Fi name and
  password on every table card.
- Scanners, kitchen and bar boards all run on that router; scanners keep working offline regardless.
- Order page stays under 200 KB, retries a failed submit automatically and shows "sending…" honestly.
- Staff can enter an order for a table from the board, so waiters can take orders by voice if a guest's phone can't
  connect.
- Visit the venue before week 6 to measure signal at the gate and in the hall.

### Privacy (UK GDPR)

- Collect only what is needed: name, contact, dietary notes. Dietary notes are visible to admin and kitchen only.
- Privacy notice on the RSVP page; delete guest data a set time after the wedding (e.g. 90 days).

### Usability and accessibility

- Mobile-first; works on older Android and iPhone browsers, no app install.
- Large tap targets, high contrast scanner results readable at arm's length, WCAG 2.1 AA on guest pages.

## Design and theming

The site should feel like a luxury printed invitation on any phone, and every colour and font comes from one
swappable theme, so a new look is one file or one click.

### Design principles

- **Mobile-first.** Designed at 375 px wide, then scaled to tablet and desktop. No horizontal scroll, tap targets at
  least 44 px, safe-area padding for notched phones.
- **The IV is the hero.** Full-bleed couple photo, an elegant display serif for the names, a short envelope-opening
  reveal. All motion respects "reduce motion" settings.
- **Built for WhatsApp.** Most guests will open the IV inside WhatsApp's in-app browser, so it must look right there:
  rich link preview (Open Graph image with the couple's photo), and QR saving and camera access tested in that
  browser.
- **Fast.** Lighthouse mobile score of 95+ for performance and accessibility; AVIF/WebP images, fonts self-hosted via
  next/font.
- **One component library.** Buttons, cards, inputs, toasts and sheets built once on theme tokens. Staff screens share
  the theme but use a plain, high-contrast layout for speed.

### How theming works

Every visual value is a design token exposed as a CSS custom property. Tailwind maps its classes to those variables
(`bg-primary` → `var(--color-primary)`), so no component contains a hard-coded colour. A theme is a single file:

```json
{
  "name": "Ivory & Gold",
  "colors": {
    "background": "#FBF8F3",
    "surface": "#FFFFFF",
    "text": "#2B2622",
    "muted": "#7A6F66",
    "primary": "#B08D57",
    "onPrimary": "#FFFFFF",
    "accent": "#5E7D6A"
  },
  "fonts": { "display": "Cormorant Garamond", "body": "Inter" },
  "radius": "16px",
  "pattern": "/themes/ivory-gold/pattern.svg"
}
```

| ID    | Requirement                                                                                                           | Priority |
| ----- | --------------------------------------------------------------------------------------------------------------------- | -------- |
| THM-1 | A theme file restyles every surface: guest pages, IV, PDF, table cards, staff screens, WhatsApp preview image         | Must     |
| THM-2 | Active theme stored in the database and applied on the server, so pages never flash the wrong colours                 | Must     |
| THM-3 | Contrast check on save: a theme whose text fails WCAG AA (4.5:1) is rejected with the failing pair named              | Must     |
| THM-4 | Scanner results keep fixed meaning colours (green valid, amber used, red invalid) whatever the theme                  | Must     |
| THM-5 | Ship 3-4 preset themes to start from                                                                                  | Should   |
| THM-6 | Admin theme editor: colour pickers, font choice from a curated list, live preview of IV and order page, then Activate | Should   |
| THM-7 | Generate a full palette from one or two seed colours (e.g. your wedding colours)                                      | Could    |

### What "flawless" means in testing

- Visual regression screenshots (Playwright) of every guest page, for each preset theme, at iPhone SE, iPhone 15, a
  mid-range Android, iPad and desktop sizes.
- Real-device check of the full IV flow from a WhatsApp message on both iPhone and Android.
- Zero layout shift on load (CLS 0), no console errors, every image with alt text.

## Data model

Nine tables cover v1; the invitation, not the person, is the unit the gate checks.

| Entity     | Key fields                                                                                              | Notes                                                                       |
| ---------- | ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Invitation | id, token (unique), max_tag_alongs, status (draft, sent, rsvp_yes, rsvp_no, revoked), table_id, sent_at | One QR per invitation                                                       |
| Guest      | id, invitation_id, name, email, phone, is_primary, meal_choice, dietary_notes                           | Tag-alongs are guests on the same invitation, added and edited by the guest |
| RSVP       | invitation_id, attending, count_attending, responded_at                                                 | Editable until the wedding day; changes logged                              |
| CheckIn    | id, invitation_id, people_admitted, device_id, staff_id, scanned_at, result                             | Sum of people_admitted ≤ count_attending                                    |
| Table      | id, number, name, capacity                                                                              | Table number is what guests type                                            |
| MenuItem   | id, name, category (meal, soft drink, alcohol), station (kitchen, bar), available, max_per_order        | Toggle available live                                                       |
| Order      | id, table_id, status, note, created_at, updated_at                                                      | Belongs to the table, not a guest                                           |
| OrderItem  | order_id, menu_item_id, quantity                                                                        |                                                                             |
| Staff      | id, name, role (gate, kitchen, bar, host), whatsapp_number, pin_hash, expires_at                        | Separate from admin accounts                                                |

## Tech stack and architecture

A single Next.js app on Supabase covers all four screens; nothing here needs a native mobile app. Every screen talks
to the one app; check-ins and orders written to Postgres are pushed live to the boards and other scanners.

| Layer                    | Suggested choice                                                | Why                                                                         |
| ------------------------ | --------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Web app and API          | Next.js (TypeScript) on Vercel                                  | One codebase for guest pages, scanner, boards and admin                     |
| Database, auth, realtime | Supabase (Postgres, Auth, Realtime)                             | Live order board and multi-scanner sync without running your own websockets |
| ORM                      | Prisma or Drizzle                                               | Typed queries and migrations                                                |
| QR generation            | qrcode npm package, server-side                                 | Simple, PNG or SVG output                                                   |
| QR scanning              | Browser BarcodeDetector API, with zxing / html5-qrcode fallback | Not every browser ships BarcodeDetector                                     |
| IV PDF                   | @react-pdf/renderer                                             | Printable IV with QR                                                        |
| Email                    | Resend or Postmark                                              | Admin login codes only; IVs go out through the Share menu                   |
| Sharing IVs              | Web Share API, wa.me links, mailto: links, Clipboard API        | Free, no third-party account; messages go from your own WhatsApp or email   |
| Offline gate             | PWA service worker + IndexedDB                                  | Survives Wi-Fi drops at the entrance                                        |
| Monitoring               | Sentry                                                          | See errors live on the day                                                  |

## Milestones, scope and testing

Build in the order guests will use it, and finish everything at least 2 weeks before the wedding so the last stretch
is rehearsal, not coding.

1. **Foundations (week 1).** Repo, auth, database schema, admin guest list with CSV import, theme tokens and base
   components.
2. **Invitations and RSVP (weeks 2-3).** IV page and design, token + QR generation, email sending, RSVP form, QR
   download. Send IVs at the end of this phase.
3. **Gate check-in (weeks 4-5).** Scanner page, validation, partial admission, manual search, scan log, offline mode,
   multi-device sync.
4. **Table ordering (weeks 5-6).** Menu editor, order page, kitchen/bar boards, live status, abuse limits, printed
   table cards.
5. **Hardening (week 7).** Full check-in test with the network switched off, load test, security review, privacy
   notice.
6. **Rehearsal (week 8).** Dry run with real staff and devices at the venue; freeze the code.

### Testing plan

- Unit tests on token validation and admission counting (the logic that must never be wrong).
- Load test: all guests scanned within a 45-minute window across 3 devices; 30 tables placing orders in the same 5
  minutes.
- Venue test: scan from phone screens at full and low brightness, in the actual lighting, on the venue Wi-Fi and on
  4G.
- Staff walkthrough: ushers and caterers each use their screen for 10 minutes before the day.
- Day-of checklist: chargers and power banks for scanners, printed guest list, backup device, someone on call to fix
  issues.

## Invitation wording

Ready-to-use copy for every message and key screen; pick one voice and use it throughout. Placeholders in braces are
filled in by the site.

### WhatsApp invitation (pick a voice)

- **Warm:** "Hi {GuestName}, two hearts, one date, and a seat with your name on it. {Couple} are getting married, and
  the day won't feel whole without you. Your personal invitation is waiting here: {Link}. Open it to RSVP and add
  anyone tagging along. Keep this link safe: it becomes your entry pass on the day."
- **Playful:** "{GuestName}, consider this your golden ticket. {Couple} are saying 'I do' and you made the list. Tap to
  unwrap your invitation: {Link}. RSVP, tell us who's coming with you, and hold on to this link, because your gate
  pass lives inside it."
- **Formal:** "Dear {GuestName}, together with their families, {Couple} request the pleasure of your company as they
  begin their forever. Kindly view your invitation and respond here: {Link}. This link is yours alone and will serve
  as your pass on the day."

### Email invitation

- **Subject:** "A seat is waiting for you, {GuestName}"
- **Body:** "Some days are written in the stars; ours is written in ink, and we'd love you to be part of it. {Couple}
  are getting married. Open your personal invitation to RSVP, add your tag-alongs and choose your meals: {Link}. Save
  this email: the same link holds your entry pass."

### Reminders

- **RSVP nudge:** "Hi {GuestName}, a gentle tap on the shoulder from {Couple}. We're setting tables and menus and we'd
  hate to plan without you. It takes under a minute: {Link}"
- **Day before:** "Tomorrow, {GuestName}! Your entry pass is ready at {Link}. Bring your phone (a screenshot of your QR
  works too), your appetite and your best dance moves."

### On the website

| Screen           | Copy                                                              |
| ---------------- | ----------------------------------------------------------------- |
| IV headline      | Two stories. One ending: forever.                                 |
| IV sub-line      | You've been part of our story. Come and see the best chapter yet. |
| RSVP buttons     | "Count me in" / "I'll be there in spirit"                         |
| Tag-along prompt | Who's walking in with you?                                        |
| RSVP confirmed   | You're in. We're already saving you a dance.                      |
| RSVP declined    | We'll miss you, and we'll raise a glass in your name.             |
| QR page          | This is your key to the celebration. Show it at the door.         |
| Gate: valid      | Welcome, {GuestName}. Table {N} is ready for you.                 |
| Order page       | Hungry? Thirsty? Say the word.                                    |
| Order sent       | On its way. Sit back, we've got this.                             |
| Order served     | Enjoy every bite.                                                 |
| Edits locked     | The big day is here, so your RSVP is locked. See you inside.      |

## Open questions

These change the scope or the timeline; answer them before week 2.

| Question                                                                           | Answer so far                                                            |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| How IVs go out                                                                     | Share menu (WhatsApp, Email, Copy link), no business account             |
| Payment at the table                                                               | None, all food and drink is free                                         |
| Venue signal                                                                       | Unknown, so offline check-in is a Must and a router is budgeted          |
| Look and feel                                                                      | Premium, mobile-first, plug-and-play themes                              |
| Wedding date and venue                                                             | Not needed for the build                                                 |
| Guest count                                                                        | 200-300                                                                  |
| IVs                                                                                | One per guest; the guest adds and edits tag-alongs until the wedding day |
| Who can order                                                                      | Anyone at the table                                                      |
| Table number                                                                       | Typed by the guest; one shared QR on every table card                    |
| Caterer                                                                            | Watches the tablet and gets WhatsApp alerts                              |
| Message wording                                                                    | Drafted above                                                            |
| Maximum tag-alongs per IV, or no limit?                                            | **Open**                                                                 |
| Which numbers get order alerts, and one message per order or a batch every minute? | **Open**                                                                 |
| Who runs the gate and the boards on the day, and on whose devices?                 | **Open**                                                                 |
| Domain name, wedding colours and photos for the first theme                        | **Open**                                                                 |
