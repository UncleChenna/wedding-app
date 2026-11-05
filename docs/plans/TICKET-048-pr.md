# Ticket

TICKET-048 — Let guests request their link again.

# Problem and intended result

Guests currently need to contact the couple directly to recover a lost invitation.
This ticket will add a neutral public request form and a private admin queue with
the existing Share menu. It will not send messages automatically.

# Current changes

This draft contains input validation, conservative name/contact matching and a
submission service that separates public request persistence from private matching.
Ambiguous households and revoked invitations are not proposed for re-sharing.
The service checks an injected budget before validation/persistence and returns
safe errors without personal details. The public result never reports a match.

# Evidence and remaining work

Twenty-one focused unit tests cover validation, phone normalization, exact matching,
ambiguity, inactive invitations, neutral responses, budget denial and storage errors.
Both suites were observed failing before their implementation existed.

Not implemented yet: durable queue/schema, dedicated budget adapter, public form,
admin queue, ShareMenu integration and navigation. No acceptance criterion is marked
complete. Database/E2E/full verification and UI/device review remain mandatory.
See docs/handoffs/TICKET-048.md and docs/plans/2026-11-05-TICKET-048.md.

# Risks and rollout

Base: develop c9c9e66010ee773189477139d4f8b0d30cf481e1. No dependency, CI or generated
migration changes are included yet. New migration output requires approval and
sequencing after TICKET-043's pending migration. No production application or
merge is requested. Current helpers are not wired to user-facing routes.
