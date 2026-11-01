---
id: TICKET-209
title: Connect guest, staff and admin journeys into one app
epic: foundations
status: in_progress
priority: urgent
estimate: L
labels: [frontend, test, docs]
module: shared
owner: divine
agent: codex
blocked_by: []
blocks: []
branch: TICKET-209
pr: ""
created: 2026-10-31
updated: 2026-11-01
started: 2026-11-01
completed: ""
reason: ""
resume_to: ""
---

# TICKET-209: Connect guest, staff and admin journeys into one app

## Context

The PRD defines three guest journeys and five roles ([Users and roles](../docs/prd.md#users-and-roles),
[User journeys](../docs/prd.md#user-journeys)). Individual pieces now exist, but nothing chains them:

- The home page hard-codes the couple, date and copy instead of reading saved event settings.
- `/invite` is a dead end that only says "a link will arrive".
- `/i/[token]` renders envelope → letter → RSVP, but has no next step after replying (pass, day-of ordering).
- `ShareMenu`, `QrCode`, `OrderPreview`, `RsvpPreview` and `InvitationView` are reachable only from `/dev`.
- `/checkin`, `/kitchen`, `/order` and `/admin` are "Coming soon" placeholders with no links between them.
  There is no staff landing page and no `/bar` route, although TICKET-077 expects one.
- Admin is a placeholder that shows Sign in and Sign out links to an already signed-in admin.

Each feature ticket builds its own screen. No ticket owns the routes between screens, so features land as
islands. This ticket defines that route contract, wires every existing piece into it, and adds a test that
fails when a route becomes orphaned. The full journey map and build order are in
[the plan](../docs/plans/2026-11-01-TICKET-209.md).

## Scope

- **Journey map.** Add `docs/journeys.md`: every role, its entry point (WhatsApp link, table-card QR, staff
  device link, admin URL), the route chain, the next step on each screen, and the ticket that builds each link.
  Link it from `AGENTS.md` and `docs/architecture.md`.
- **Route registry.** Add one typed source, `src/modules/shared/lib/routes.ts`, for app routes and their
  audience (guest, staff, admin, dev). Navigation links use it instead of string literals.
- **Guest home.** `/` reads couple names, date, venue and time from event settings. Couple names and dates are
  no longer hard-coded in page code or metadata. `/invite` explains how to get the link and offers the
  contact or "request your link" step (a placeholder until TICKET-048).
- **Invitation chain.** After an RSVP, `/i/[token]` shows a clear next step for the guest's answer:
  - Yes: a "Your pass" section with a reserved slot, until TICKET-044 fills it.
  - No: a warm closing message.
  - Not yet answered: the form.

  On or after the event date it also points to "Order to your table" (`/order`). The page links back to the
  home page throughout.
- **Staff hub.** Add `/staff`, a calm, arm's-length landing page that links to Gate check-in, Kitchen board and
  Bar board. Add a `/bar` placeholder that matches `/kitchen`. Give the staff layout a shared header with
  "Staff home" and the station name. PIN protection stays out of scope (TICKET-031 and TICKET-032).
- **Admin hub.** Replace the admin placeholder with a control-room index listing each area: Guests, Sharing,
  Seating, Menu, Staff, Settings, Live dashboard. Each item links to its route or is labelled "Coming soon"
  with its ticket ID in `docs/journeys.md`.
  - Show only Sign out when signed in.
  - Promote `ShareMenu` from `/dev/share` to an admin "Sharing" page that lists invitations with share actions.
    If TICKET-089's guest list has not landed, use the existing invitation repository with a minimal list.
- **Placeholders.** Every "Coming soon" screen names its next step and has a way back to its hub. No screen is
  a dead end.
- **Dev previews.** `/dev` stays unreachable in production builds. Each preview is listed in
  `docs/journeys.md` with the ticket that will promote it to a real route.
- **Orphan-route test.** Add a Playwright spec that crawls from each entry point (`/`, a seeded `/i/[token]`,
  `/order`, `/staff`, `/admin` after sign-in). It fails if a registered non-dev route can't be reached, or if
  a page has no link back to its hub.

## Out of scope

- The admin shell's full sidebar and responsive navigation component (TICKET-088). This ticket provides the hub
  page and the link registry that TICKET-088 builds on.
- QR pass contents and signing (TICKET-044, TICKET-056, TICKET-183).
- Real ordering, boards and scanner behaviour (TICKET-070 to TICKET-079, TICKET-059 onward).
- Staff PIN sign-in and route protection (TICKET-031, TICKET-032).
- Guest list filters and editing (TICKET-089, TICKET-090).
- Multi-event or multi-tenant routing (not ticketed yet).

## Acceptance criteria

- [x] `docs/journeys.md` lists every role, entry point, route, next step and owning ticket; `AGENTS.md` and `docs/architecture.md` link to it.
- [x] `src/modules/shared/lib/routes.ts` is the single route source; a unit test fails if a non-dev `page.tsx` under `src/app` is missing from it.
- [x] `/` and its metadata render couple names, date and known venue details from event settings; a grep finds no hard-coded couple names in `src/app`.
- [x] `/i/[token]` shows the correct next step for yes, no and unanswered, before and on the event date; a component test covers every state.
- [x] `/staff` links to `/checkin`, `/kitchen` and `/bar`, every staff page links back, and staff text is at least 18px with station titles at least 32px.
- [x] `/admin` is a hub listing every admin area; a signed-in admin sees Sign out but not Sign in, and sharing is reachable without `/dev`.
- [x] No production page is a dead end: each has a primary next step or a link back to its hub.
- [x] The orphan-route Playwright spec passes, and fails when one registered route is unlinked in a test fixture.
- [x] `/dev` returns 404 in a production build.
- [ ] The UI checklist passes on every changed route in all four themes at 375, 768 and 1280px, with screenshots in `docs/reviews/TICKET-209/`.
- [x] `pnpm verify` passes.

## Test plan

- **Unit:**
  - The route registry matches the `src/app` page files.
  - The invitation next-step function returns the right step for each RSVP state and date.
  - The home page reads its values from event settings.
- **Component:**
  - `PersonalInvitation` renders the correct next step for yes, no, unanswered, before the event and on the
    day.
  - The admin hub renders the correct links when signed in.
- **End-to-end:**
  - The orphan-route crawl.
  - Guest: home → invitation → RSVP yes → pass slot → back.
  - Staff: `/staff` → each station → back.
  - Admin: sign in → hub → Sharing → share action.
  - Axe checks on every new page.
  - `/dev` returns 404 on the production build.
- **Manual:**
  - Tap through every journey on a phone at 375px in light and dark mode.
  - Check that WhatsApp's in-app browser can follow the invitation link back to the home page.

## Files likely touched

- `docs/journeys.md`, `docs/architecture.md`, `AGENTS.md`
- `src/modules/shared/lib/routes.ts` and its tests
- `src/app/(guest)/page.tsx`, `src/app/(guest)/invite/page.tsx`
- `src/modules/invitations/components/personal-invitation.tsx` and a new `invitation-next-step` lib
- `src/app/(staff)/layout.tsx`, `src/app/(staff)/staff/page.tsx`, `src/app/(staff)/bar/page.tsx`
- `src/modules/admin/components/admin-dashboard.tsx`, a new admin Sharing route
- `src/modules/shared/components/page-placeholder.tsx`
- `e2e/journeys.spec.ts`

## Notes / decisions

- 2026-11-01: All supplemental showcase sections inspected; full per-item UI review is recorded. No final approval: cold-font CLS fails and physical checks remain unverified. DraftPR68 awaits preview exception; functional work is preserved.

- 2026-11-01: Private invitation Lighthouse99/100/100, accessibility100 throughout, CLS0 throughout; synthetic fixture cleaned. All six before/day-of RSVP component cases pass. Functional acceptance is verified; UI completion remains open for exact-zero cold-font shifts and remaining review gates.

- 2026-11-01: Local services recovered; authenticated journey and full verification passed. Final admin refinement passes its unit/build and13 browser cases. RSVP/staff/admin screenshots inspected; public/auth review is ongoing. Lighthouse reveals home performance90 and nonzero home/guide CLS; these remain unresolved. PR68 stays draft. See handoff and REVIEW.md for precise evidence.

- 2026-11-01: Added actual-link crawl and passing negative orphan fixture, plus explicit auth/offline exits. Build and static checks pass. Real authenticated journey remains unverified: pending local Auth followed by a confirmed isolated Postgres connection timeout on retry. No timeouts or assertions were weakened; see handoff for live diagnostic handle and recovery steps.

- 2026-11-01: Production preview guard verified against separate default and explicitly enabled local servers;4 browser smoke cases pass. Default404 criterion checked. Orphan crawl, authenticated sharing and final UI/full verification remain outstanding.

- 2026-11-01: Staff/bar navigation, admin hub and authorized sharing page implemented; route map and template rule added.58 focused tests, quick verification, production build and staff/anonymous-access browser checks pass. Authenticated sharing, production preview guard, orphan crawl and final UI/full verification remain outstanding; all acceptance criteria stay unchecked.

- 2026-11-01: Guest checkpoint implements settings-driven home/metadata, resend guidance and RSVP next steps.142 invitation unit tests, quick verification, production build and15 live/review browser cases pass (see handoff for exact build scope). Final UI review and remaining staff/admin/route-contract work are outstanding. Unknown venue time zone keeps automatic day-of navigation hidden rather than guessing.

- 2026-11-01: Route registry checkpoint: four focused tests and quick verification pass; existing navigation and accessibility inventory use shared routes. Remaining journey implementation and full browser/UI verification are outstanding; PR68 stays draft.

- 2026-11-01: Claimed and isolated from freshly merged develop0f30f2f; current implementation plan is2026-11-01-TICKET-209.md. The original referenced plan only exists uncommitted in025; that checkout remains untouched. No feature acceptance is certified by setup.

_Agents append dated notes here while working._

- 2026-10-31: Created after a code review of `develop` at `c9edef6`. The review found that every built
  component except the invitation page is reachable only from `/dev` or not at all. The plan doc holds the
  journey map and the order in which other tickets plug into it.

 - 2026-11-01: Production public84 and authenticated MFA60 screenshots inspected; MFA flow passes. Local entry-page layout changes improve Lighthouse to98/99, but strict cold-font CLS remains failing. Reports and regression test retained; PR68 stays draft. See REVIEW.md for exact results.

## Activity log

- 2026-10-31 — new → todo — unclechenna
- 2026-11-01 — todo → claimed — divine (codex)
- 2026-11-01 — todo → in_progress — divine (codex)
- 2026-11-01 — in_progress → blocked — divine (codex) — PR68 remains draft: exact-zero cold-font CLS fails; physical UI checks unverified. Awaiting requested preview-only exception while preserving TICKET-201 release gates.
- 2026-11-01 — blocked → in_progress — divine (codex) — User approved advancing navigation preview while retaining exact-zero CLS and physical-device release gates in TICKET-201
