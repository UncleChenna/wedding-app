# Ticket

TICKET-199 — Build the RSVP frontend preview with confirmation states.

# Summary

The invitation preview previously had no RSVP journey to explore. `/dev/rsvp` now offers a complete labelled sample flow: attendance, named companions, meal choices, review and either confirmation. Nothing is saved or sent; production invitation and RSVP integration remain separate.

# Changes

- Add a feature-level client form using existing shared controls and theme tokens, with focus management, inline errors, stable companion identity and preserved Back/theme-switch state.
- Validate trimmed 1–80 character names, known sample meals and a maximum of two sample companions with Zod. Reset/reload discards the draft.
- Link the flow from the preview index and invitation preview; add the route to the common accessibility inventory.
- Handle expected cancelled CSS transitions in the accessibility wait helper without suppressing real scan failures. A regression injects a violation during cancellation and verifies it is reported. The theme helper switches actual preview controls for accurate theme coverage.

# Acceptance criteria and evidence

All five criteria are covered by schema tests and complete browser journeys, including empty/invalid input, add/remove limits, retained fields, 80-character names, keyboard focus, both outcomes and zero mutation requests. The reviewer index links the new route. See docs/reviews/TICKET-199/README.md and its 54 screenshots for all states, themes and widths.

# Verification

pnpm verify:quick and pnpm verify pass: 239 unit tests, 138 browser tests, 16 conditional skips, typecheck, lint, formatting, ticket validation and production build. Repository screenshots: 12 passed. The PR workflow reruns the full gate. Real WhatsApp device and release performance/CLS checks are not claimed; they remain in TICKET-201 under the user's approved preview exception.

# Risks and rollout

Preview-only rules: names, meals and two companion places are samples. No server actions, authentication, persistence, browser storage, messages, database migrations or credentials are added. Production must obtain allowances/menu/identity from trusted server data and revalidate server-side. `/dev/rsvp` is noindex. Revert the ticket commit to remove the preview; no data rollback is needed. User explicitly authorized merging previews with outstanding QA tracked separately; merge only after required CI passes.

# Screenshots

54 state captures in docs/reviews/TICKET-199/screenshots/ cover both themes at 375/768/1280. Review `/dev` → RSVP preview; try both answers, add/remove companions, leave required fields blank, switch theme mid-form and reload after confirmation. Responses must never be sent or restored after reload.

# UI checklist

Per-item evidence and the approved preview-only scope are in docs/reviews/TICKET-199/README.md. No production readiness claim is made for deferred TICKET-201 checks.

# Harness changes, if any

Only browser test helpers: expected animation cancellation handling and selecting the real preview theme control. Regression coverage confirms accessibility violations remain blocking. No CI, hook or policy changes.
