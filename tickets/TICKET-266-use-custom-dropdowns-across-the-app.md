---
id: TICKET-266
title: Use custom dropdowns across the app
epic: theming
status: in_review
priority: high
estimate: M
labels: [frontend]
module: shared
owner: UncleChenna
blocked_by: []
blocks: []
branch: TICKET-266
pr: "https://github.com/UncleChenna/wedding-app/pull/232"
created: 2026-11-19
updated: 2026-11-19
---

# TICKET-266: Use custom dropdowns across the app

Replace shared native picker presentation with a themed custom combobox/listbox for all
admin, invitation, ordering and showcase consumers. Preserve form values, validation,
disabled states and reset. Menus must work inside dialogs and within small viewports.

## Acceptance criteria

- [x] Every hydrated app dropdown uses the shared custom menu.
- [x] Pointer, keyboard, typeahead, Escape, disabled options and focus behavior work.
- [x] Named values submit once; controlled/uncontrolled/reset and required validation work.
- [x] Menus remain visible in modals and small viewports without horizontal overflow.

## Test plan

Shared component tests, consumer regressions, type/lint checks and representative browser
flows (admin form/modal, theme showcase and guest form). Physical screen readers remain
release QA. No new dependency or schema changes.
