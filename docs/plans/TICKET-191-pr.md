# Ticket

TICKET-191

# Summary

Quantity controls lost keyboard focus when a step disabled the focused button, and arrow keys ignored an uncommitted typed quantity. The stepper now moves focus to its input at either bound and steps from the clamped typed draft. Input className and required are forwarded.

# Changes

Add an input ref for boundary focus transfer while retaining native disabled button semantics. Arrow keys parse the draft instead of using the previously committed number. Existing layout, themes, labels and button sizes remain unchanged. No guest route or backend work is included; typography TICKET-015 remains paused.

# Acceptance criteria and evidence

Unit regressions cover draft 3 → ArrowUp → 4, ArrowDown, required/className and focus at both limits. Browser coverage uses actual Enter/Space activation at 375/768/1280 in every registered theme, asserts focus stays on the input and captures the affected form. The two new unit regressions failed before implementation and pass after it.

# Verification

Quick and full gate results are recorded in docs/handoffs/TICKET-191.md. Screenshots and scoped UI assessment are in docs/reviews/TICKET-191/. Physical phone keyboard/WhatsApp testing was not performed; this component currently appears in the development showcase, with no new guest journey in this PR.

# Risks and rollout

Reaching a bound deliberately transfers focus from the disabled button to its associated number input. Consumers using controlled values must still update the supplied value normally. No new dependencies, migrations, CI or token changes. Rollback by reverting this ticket's component/test changes. Human review and merge into develop only.

# Screenshots

See docs/reviews/TICKET-191/screenshots: affected form in both themes at 375, 768 and 1280px.

# UI checklist

Scoped review is recorded in docs/reviews/TICKET-191/README.md. No typography, image, motion, sharing, QR or staff-feedback implementation changed.

# Harness changes, if any

None. Ticket-specific tests, plan and handoff only.
