# TICKET-017 handoff

## 2026-10-22 — TICKET-017 — Base components hardened

- **Who / agent / branch:** unclechenna · claude · `TICKET-017`, base `develop` d105dbb.
- **Changed:**
  - Button: 44px minimum for every size, and the spinner stops under reduced motion.
  - Toast: tone icon plus screen-reader label, an assertive region for errors, and a 44px dismiss button.
  - Sheet: explicit Tab trap.
  - New `e2e/a11y.spec.ts`: sheet keyboard flow, 44px sweep, axe.
  - `@axe-core/playwright` dev dependency (owner-approved).
- **Checks:**
  - New unit tests and e2e failed first, then passed.
  - `pnpm verify` passed: 154 unit tests, build, 30 browser tests.
  - Screenshots inspected in both themes at 375, 768 and 1280px.
- **Learned:**
  - Native `<dialog>` does not trap Tab.
  - axe must scan after finite animations settle, or fades produce false contrast failures. Infinite animations (spinners) must be excluded from the wait.
- **Next / blockers:** Human review of the PR into develop. TICKET-018 (form components) and TICKET-019 (staff components) build on this. TICKET-128 extends axe to every route.
