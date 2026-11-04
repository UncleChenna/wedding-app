---
id: TICKET-095
title: Build the menu editor with a live sold-out toggle
epic: admin
status: in_review
priority: high
estimate: M
labels: [frontend, backend]
module: admin
owner: unclechenna
agent: claude
blocked_by: [TICKET-171, TICKET-088]
blocks: [TICKET-134, TICKET-157]
branch: TICKET-095
pr: https://github.com/UncleChenna/wedding-app/pull/96
created: 2026-10-21
updated: 2026-11-04
started: 2026-11-04
completed: ""
reason: ""
resume_to: ""
---

# TICKET-095: Build the menu editor with a live sold-out toggle

## Context

ADM-4: the couple set the menu; items can be marked sold out live.

See: [Admin dashboard](../docs/prd.md#admin-dashboard) (ADM-4) · [Table ordering](../docs/prd.md#table-ordering) (ORD-2).

## Scope

- CRUD for items: name, category, station, available, max_per_order, sort, optional photo.

## Out of scope

- Order page.

## Acceptance criteria

- [x] Sold-out toggle updates the order page within 5s (e2e).
- [x] Validation prevents an item without a station.

## Test plan

- Unit: Validation.
- End-to-end: Toggle sold out.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/modules/admin/`

## Notes / decisions

_Agents append dated notes here while working._

- 2026-11-04:
  - **Page.** `/admin/menu` (in the admin shell's navigation and the control-room grid): items by category with
    Available / Sold out in words, a sold-out toggle, an edit form in a disclosure, removal, and an "Add an item"
    form. Fields: name, description, category, station (required), most per order, position, dietary tags.
  - **Safety.** Every Server Action checks admin access itself (`withCurrentAdminAccess`), not only the page and
    proxy. Input is validated with Zod and normalised to single-line text. Removing an item that has been ordered is
    refused ("mark it sold out instead") because `order_items` references it. Database errors become a retryable
    message without details.
  - **Found and fixed:** a refused form was emptied, because React 19 resets a form after its action. Rejected values
    now come back as defaults, and the two selects are controlled (selects don't take new defaults after a reset).
  - **Evidence.** `e2e/admin-menu.spec.ts` (`RUN_ADMIN_MENU_TESTS=1`, a fresh `ADMIN_MENU_TEST_EMAIL` on
    `ADMIN_EMAIL_ALLOWLIST`, this worktree's local Auth): real email-code and TOTP sign-in; no-station refusal with
    typed values kept; add; sold out reaches an open guest order page within 5s and back; axe once per theme; no
    overflow at 375/768/1280; removal. Unit: `menu-item.test.ts`.
  - **Not done:** photos (no image column on `menu_items`, needs a migration); a confirmation step before removing an
    item that has never been ordered.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-11-04 — todo → claimed — unclechenna (claude)
- 2026-11-04 — todo → in_progress — unclechenna (claude)
- 2026-11-04 — in_progress → in_review — unclechenna (claude)
