# Ticket

TICKET-209 — Connect guest, staff and admin journeys into one app

# Summary

Existing screens are disconnected. This ticket will connect them through a typed route registry, guest next steps and staff/admin hubs. This draft currently contains the implementation plan and ticket setup only.

# Changes

- Claimed an isolated branch from develop0f30f2fc3045506944e5252adb396c40856f7e0c.
- Added the complete dated plan and handoff; corrected the ticket's missing plan link.
- Runtime implementation remains outstanding.

# Acceptance criteria and evidence

All feature criteria remain unchecked. Remaining: journey documentation, route registry/inventory tests, saved-settings home/metadata, RSVP next steps, staff/bar hubs, authenticated admin sharing, navigable placeholders, production /dev guard, orphan-route positive/negative tests and complete UI review.

# Verification

Managed setup completed using the existing pinned dependencies; isolated database migration succeeded. No feature tests or browser checks have run for this ticket yet. Document formatting and ticket validation will be checked before committing this plan.

# Risks and rollout

This draft is not ready to merge. Preserve authentication before reading invitation links, unknown event details, existing RSVP editing and platform installation controls. Keep preview test configuration separate from production access to /dev. No schema, RLS, service or dependency change is proposed. Device and performance release requirements remain mandatory.

# Review steps

Read docs/plans/2026-11-01-TICKET-209.md against the complete ticket scope. No new user-facing behavior is available yet.

# Screenshots and UI checklist

Pending implementation; no UI change in this planning commit. All changed routes will require all-theme375/768/1280 review before preview delivery.

# Harness changes

A shared route contract and its tests are planned; no workflow or CI configuration change has been made.
