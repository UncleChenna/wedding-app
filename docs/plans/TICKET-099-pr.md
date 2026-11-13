## Summary

Adds `/admin/design` so an authenticated administrator can preview and save the invitation photograph and wording. Saved changes now appear on guests’ personal invitations. Uploading alone keeps a photo private; saving deliberately publishes the selected image.

## Changes

- Reuse the existing validated upload endpoint, with an attributed stock fallback and editable accessible description.
- Preserve typed wording after failed uploads/saves; reject stale writes from another editor window.
- Add a versioned singleton design table with RLS and bounded fields, and selected-only public image delivery for Next image optimization.
- Connect saved wording/photo to the guest letter and keep the mobile save action above navigation.

## Acceptance criteria and evidence

All ticket acceptance criteria are covered in [verification](https://github.com/UncleChenna/wedding-app/blob/TICKET-099/docs/reviews/TICKET-099/verification.md): invalid uploads, real edit/save/reload, honest stock preview, reuse of the existing upload service, and recoverable failures.

Real email/TOTP mobile 375 and desktop 1280 journeys pass, including private-to-public photo publication, stale competing saves, keyboard save and the guest result. Eight editor screenshots are under `docs/reviews/TICKET-099/`; the solid-colour image is a synthetic upload fixture.

## Verification

- Production build and normal integration commit verification pass.
- Four isolated database tests pass; repeat migration succeeds; all 28 public tables have RLS.
- Mobile browser journey passes in 10.1s; desktop in 8.5s. Eight all-theme axe scans report zero violations.
- Independent source review found no blocking issue. An unchanged raster test initially timed out under concurrent local load; it passed unchanged after checks were serialized.

## Risks and rollout

Migration `0036_invitation-design.sql` follows develop’s unchanged 0035 Wi-Fi migration. Apply it before deploying this code; no production application has been performed. Roll back application usage while retaining the additive data table.

The selected photo is public and cached copies may remain after replacement. Final photo rights/approval remain TICKET-008. Fresh guest Lighthouse and physical-phone/WhatsApp checks are not claimed; existing release gates TICKET-116/201 remain mandatory under the approved preview workflow. The known merged offline-pass CI fixture-order issue is tracked separately in TICKET-242.
