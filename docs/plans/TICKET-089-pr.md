# Ticket

TICKET-089 — Build the guest list with RSVP status and filters.

# Summary

Adds a private guest-list page reachable from the admin dashboard. It combines
household/member search with lifecycle, sent, side and table filters and shows
named party sizes separately from saved RSVP counts.

# Changes

- Authorized server reader and minimal guest-list view model.
- Responsive list, result announcements, reset filters and expanded sharing actions.
- A real retry action for storage failures; no empty-list success on read failure.

# Acceptance criteria and evidence

Combined filtering is unit-tested. Browser usability at375px and the300-invitation
render/filter timing requirement remain unverified. Started ahead ofTICKET-043;
revoke/reissue controls will reuse that dependency and this PR stays draft until
it merges and the combined flow is verified.

# Verification

11 focused tests passed; lint, strict types and112related tests passed (one opt-in
skip). Browser, performance and final CI are pending. Early independent review
found no security blocker; its long-side wrapping finding has been addressed but
still needs a browser regression.

# Risks and rollout

Private admin-only route, no schema/dependency/production changes. Depends on043.
No import/export or first-share sent tracking included; those remain their tickets.
Revert this PR to remove the page and its dashboard link.

# Screenshots

Pending authenticated375px capture and all-theme axe checks.

# UI checklist

Not complete: browser evidence,300-row latency and lifecycle integration pending.
Theme tokens/shared controls used; no photos, QR rendering or animation added.

# Harness changes, if any

None.
