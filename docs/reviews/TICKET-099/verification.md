# Invitation design editor verification

2026-11-13. Integrated develop `21722cb9`. PR #197.

## Functional evidence

- Production build passes. Normal integration commit hooks pass lint, types, related tests and CI parity. The initial parallel run hit one unchanged pass-image5s timeout; the unchanged two cases then passed in1.77s and normal commit verification passed.
- Unit coverage includes image MIME/8MB bounds, failed-upload wording preservation, eight action authorization/version/error tests, four public-photo handler tests and saved plain-text wording.
- Four isolated database cases pass: absent-photo refusal, concurrent version protection, selected-only public bytes, singleton/bounds/RLS constraints.
- Migration 0036 generated after preserving develop's0035_wifi-settings byte-for-byte. Only this ticket's synthetic database was reset after explicitly checking its data; complete migration history applied, repeat migration passes, all 28 public tables retain RLS. No production application.
- Real email-code/TOTP browser journey passes at375px (7.4s test/10.1s total) and1280px (6.7s/8.5s): invalid upload, private valid upload, explicit publication, stale competing save rejection without text loss, reload, keyboard save, and unauthenticated guest display of saved wording and photo.
- Both browser journeys scan every registered theme: eight axe scans, zero violations. Eight editor screenshots are alongside this report. Brown artwork is a synthetic uploaded JPEG, normalized by the existing upload service; it is not the final couple photograph.

## UI checklist

- Screenshots: admin375 and1280 in four themes. Guest layout reuses the merged TICKET-038 hero; publication is exercised at both widths. A separate full guest theme/width matrix was not repeated.
- Tokens/type/restraint: shared token classes and components, display-serif headings,18px body/labels, bounded prose and reserved image areas. No new brand values.
- Mobile/keyboard: labelled controls and existing44px controls; four navigation rows have bottom clearance; keyboard save is focused above phone navigation and submits successfully. Physical keyboards/phones remain unverified.
- Contrast: axe passes all four palettes in both projects.
- Images: generated blur on stock import, stored blur on uploaded metadata, exact responsive sizes, reserved aspect ratios, honest stock alt/attribution. Upload previews use authenticated fetch and revoked-on-cleanup blob URLs; guest images use the selected public endpoint and Next image optimization.
- Motion: no new animation; existing shared controls remain unchanged.
- Copy/errors: approved Warm wording can be restored; publication/privacy consequences are explicit; failures retain text and do not expose storage errors.
- Guest performance/physical-device/WhatsApp checks: not newly certified here. Existing TICKET-116/201 release gates and TICKET-008 final image rights/approval remain mandatory under the authorized preview workflow.
- QR: no QR rendering or scanner changes.

## Review and rollout

Independent source review found no blocking authorization, optimistic concurrency or metadata-exposure defect. An administrator must complete sign-in before every save. Uploading alone is private; saving publishes only the selected image. Previously published/cache copies cannot be recalled by replacing the selection.

Apply the additive0036 migration before application deployment. To roll back, revert application usage while retaining the table/data; no destructive database rollback is required. Do not remove an already deployed migration.
