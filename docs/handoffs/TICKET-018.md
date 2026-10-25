# TICKET-018 handoff

## 2026-10-22 — TICKET-018 — Form controls

- **Who / agent / branch:** unclechenna · claude · `TICKET-018`, base `develop` 3c2131e.
- **Changed:**
  - New controls: Field, Textarea, Select, Checkbox, RadioGroup and QuantityStepper, all on native elements with no new dependencies.
  - Input now shares the same label/hint/error parts.
  - A form-controls card on `/dev/theme`.
  - Extended browser tests.
- **Checks:**
  - 13 new unit tests failed first, then passed.
  - `pnpm verify` passed: 167 unit tests, build, 31 browser tests.
  - axe 0 violations; 375px tap-target sweep clean.
  - Screenshots inspected in both themes.
- **Learned:**
  - Native inputs rendered from a Server Component must not receive event handlers unless one is supplied.
  - `cn` is plain clsx, so shared classes must not carry utilities a component may override (like width).
- **Next / blockers:** Human review of the PR into develop. Unblocks TICKET-021, 040, 050 and 070.
