# Ticket

TICKET-200 — Build table entry and menu ordering frontend previews.

# Summary

Reviewers previously could not explore table ordering. `/dev/order` now provides a complete labelled sample journey from table entry to menu, review and simulated Received/Served states. Nothing is sent or stored.

# Changes

- Add a module-level preview using shared controls and existing theme tokens, linked from /dev.
- Validate sample tables 1–30, integer quantities 0–10, available menu items, non-empty selections and a 200-character optional note.
- Preserve selections when filtering, changing theme/table or navigating Back. Restart clears the basket; reload clears all state.
- Add schema tests and browser journeys covering validation, empty/sold-out states, focus, accessibility, responsive screenshots and absence of mutation requests.

# Acceptance criteria and evidence

All five ticket criteria are checked. Eight states in both registered themes at 375/768/1280 are covered by 48 reviewed screenshots in docs/reviews/TICKET-200/screenshots/. Detailed checklist and integration boundaries: docs/reviews/TICKET-200/README.md.

# Verification

pnpm verify:quick and pnpm verify pass: 242 unit tests, 155 browser passes, 17 conditional skips, formatting, lint, types, ticket validation and production build. Repository screenshot command: 12 passed. PR workflow repeats the full gate. Physical WhatsApp/device and release performance/CLS checks remain unverified in TICKET-201 under the user's explicit preview-merge approval.

# Risks and rollout

The menu, availability, limits and service transitions are samples. No backend, storage, credentials, real orders, inventory updates or kitchen/bar notifications are added. Production must resolve trusted table/menu data and revalidate server-side. Local Supabase setup failed; this database-free preview passed with public example configuration, and no database readiness is claimed. Route is noindex. Revert this ticket to remove it; no migration or data rollback is needed. Merge only after required CI passes.

# Screenshots

See docs/reviews/TICKET-200/screenshots/. Open /dev → Table ordering preview. Try invalid table 31 then table 12; add items across categories; enter a fractional quantity; switch themes; review and change table; preview the order and simulate service. Reload must clear the draft. Nothing should reach a kitchen or bar.

# UI checklist

Per-item evidence and approved deferred QA are recorded in docs/reviews/TICKET-200/README.md. No production-readiness claim is made.

# Harness changes, if any

Only adds /dev/order to the common route inventory. No CI, hook or policy changes.
