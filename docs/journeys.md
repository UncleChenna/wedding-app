# Application journeys

TICKET-209 owns connections between screens. Feature tickets retain the behavior behind each connection. Read the [PRD roles and journeys](prd.md#users-and-roles) alongside this map.

The typed navigation source is [routes.ts](../src/modules/shared/lib/routes.ts). Its unit inventory covers every page, including private and preview pages. Route metadata is not authorization: server data readers must enforce access themselves.

## Roles and entry points

| Role                  | Entry                                | Route chain and next action                                                                                                                                                        | Owners                                                         |
| --------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Guest receiving an IV | Personal WhatsApp/email link         | `/i/[token]` → reply → reserved pass section for yes, warm closing for no; reply remains editable. Home is always available.                                                       | 036,037,039,040; tag-alongs/meals041–043; real pass044/056/183 |
| Guest at the gate     | Same private link, saved pass or PDF | Reopen pass → show to gate staff. The current reserved slot is not an entry pass.                                                                                                  | 044,056,107,183                                                |
| Guest at a table      | Shared table-card QR                 | `/order` → enter table → menu → submit → live status. Current placeholder directs guests to the team.                                                                              | 070–075,094                                                    |
| Gate staff            | Staff device link                    | `/staff` → `/checkin` → future PIN/scan/admit/escalation workflow → Staff home                                                                                                     | 031,032,055,059 onward; offline108                             |
| Kitchen/bar staff     | Staff device link                    | `/staff` → `/kitchen` or `/bar` → future received/preparing/served controls → Staff home                                                                                           | 031,032,074,076–079                                            |
| Optional table host   | Assigned staff device                | Future PIN-protected filtered station view → assigned tables → delivered. No separate route is implemented yet;082 must register its chosen route and connect it to the staff hub. | 082 plus031/032                                                |
| Admin                 | Bookmark `/admin`                    | Sign in → TOTP → control room → Sharing → share menu or copy link → control room → sign out                                                                                        | 029,030,050,052,209; full shell088                             |

Staff pages currently contain public placeholders only. They must not receive operational guest/order data until031/032 protect them. Admin Sharing authorizes before any invitation query. Sharing opens the chosen client application; it does not itself send a message or mark an invitation sent (051).

Day-of navigation uses the configured venue's calendar date. With the owner's time zone still TBD, automatic ordering navigation remains hidden rather than guessing midnight. This navigation never grants ordering permission.

## Current route inventory

| Route                    | Audience / entry                            | Next step or return                                           | Feature owner               |
| ------------------------ | ------------------------------------------- | ------------------------------------------------------------- | --------------------------- |
| `/`                      | Public homepage                             | Your invitation → `/invite`                                   | 209; event settings101      |
| `/invite`                | Guest without their link                    | Check messages; ask inviter to resend; back home              | 209; automated request048   |
| `/i/[token]`             | Personal invitation                         | Reply/edit, reserved pass or closing, day-of order link, home | 036–044,209                 |
| `/order`                 | Table QR / day-of invitation                | Ask team until ordering lands; home                           | 070–075                     |
| `/staff`                 | Staff bookmark                              | Gate, kitchen, bar; home                                      | 209                         |
| `/checkin`               | Staff hub                                   | Gate lead while unavailable; Staff home                       | 059 onward                  |
| `/kitchen`               | Staff hub                                   | Station lead while unavailable; Staff home                    | 076,078,079                 |
| `/bar`                   | Staff hub                                   | Station lead while unavailable; Staff home                    | 077,078,079                 |
| `/admin`                 | Admin bookmark or successful authentication | Sharing; sign out; home                                       | 088,209                     |
| `/admin/sharing`         | Authenticated control room                  | Share published household invitation; back to control room    | 050,052,209; guest list089  |
| `/admin/sign-in`         | Admin gate                                  | Email code → account status → admin/TOTP                      | 029,030                     |
| `/admin/mfa`             | Signed-in account requiring second factor   | Enrol/challenge → control room; sign out                      | 030                         |
| `/admin/sign-out`        | Admin account controls                      | Sign out → sign-in/home                                       | 029                         |
| `/offline`               | Worker fallback                             | Retry the failed page or return home; no invented cached pass | 106; actual offline pass107 |
| `/dev`                   | Development preview index                   | Every preview listed below; home                              | 209                         |
| `/dev/theme`             | Preview index                               | Component/theme inspection; preview index                     | 013–016                     |
| `/dev/invitation`        | Preview index                               | Hero/photo review; preview index / letter                     | 038 → personal IV037        |
| `/dev/invitation/letter` | Preview index                               | Letter/envelope/details review                                | 037,039 → personal IV       |
| `/dev/rsvp`              | Preview index                               | Local RSVP prototype review                                   | 040–043 → personal IV       |
| `/dev/order`             | Preview index                               | Ordering prototype review                                     | 070–075 → `/order`          |
| `/dev/share`             | Preview index                               | Synthetic share controls                                      | 050/052 → `/admin/sharing`  |

Production preview routes return404 by default. The negative orphan-route browser fixture passes; the full authenticated production crawl is implemented but not yet verified because local Auth/Postgres became unavailable during its run. Preview URLs must not become production navigation destinations. Full UI review is outstanding; this map does not certify release readiness.

## Admin areas still to be connected

The control room labels unimplemented areas “Coming soon”; it does not link to missing routes.

| Area           | Owning tickets | Future connection                                          |
| -------------- | -------------- | ---------------------------------------------------------- |
| Guests         | 089–092,100    | Guest list, edit/import/export, RSVP history               |
| Sharing        | 050–054        | Existing sharing page; sent-state/reminders still separate |
| Seating        | 093,094        | Table assignment and printed cards                         |
| Menu           | 095            | Menu and sold-out controls                                 |
| Staff          | 096            | PIN management and expiry                                  |
| Settings       | 098,099,101    | Theme, invitation design and event settings                |
| Live dashboard | 097            | Live event counters                                        |

## Adding a screen

Register its route and audience, connect it from the appropriate hub or authorized entry, provide a next step/back link, and update this map with its feature owner. Include the route in browser traversal and all-theme accessibility coverage. A placeholder must state its current limitation and a useful human fallback. Do not treat a preview as the completed feature.

## Local production preview verification

Ordinary `pnpm start` does not expose `/dev` pages. For deliberate local visual review only, start with `ENABLE_LOCAL_PREVIEWS=1 pnpm start`; the request hostname must also be localhost,127.0.0.1 or[::1]. Do not configure this flag on deployments. Playwright opts in only its loopback server through `webServer.env`; a separate smoke test starts the same production build with the flag empty and checks every registered preview returns404. Query parameters and RSC headers do not opt in. Preview responses are no-store and noindex.
