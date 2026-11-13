# Ticket

TICKET-038

# Summary

The personal invitation previously opened with text only. It now has a full-width photograph with reserved responsive dimensions, an immediate blur placeholder and optimized WebP delivery through Next Image. Names, reply navigation, pass and event details retain their existing behavior below it.

## Changes

The approved stock photograph is visibly identified as a sample and credited to Lauren Mitchell/Unsplash. It is never described as Uchenna and Adaora. A typed optional photo field accepts a saved source, descriptive alt text and blur metadata for the later TICKET-099 editor; this ticket does not add storage or publishing controls. Final photo rights and approval remain TICKET-008 release requirements.

## Acceptance criteria and evidence

- Missing-component regression reproduced, then12 focused hero/letter/invitation tests passed.
- Quick verification passes lint, TypeScript and21 related unit tests.
- Final production build passes. All13 private-route browser cases pass (19.2s): four themes at375/768/1280, actual optimized WebP responses, viewport-width image, axe zero, keyboard reply focus and unchanged hero/heading positions when the image finishes decoding.
- Final crops inspected in `docs/reviews/TICKET-038/`; desktop uses top alignment to retain both faces. Independent source review is clean.
- Lighthouse13.6 mobile on the actual synthetic private route: Performance90, Accessibility100, CLS0, LCP3.64s. The95 performance target remains unmet and tracked by TICKET-116/TICKET-201; standing preview authorization applies. No physical WhatsApp/iOS/Android success is claimed.

## Verification

Production build, quick lint/types/21 related tests and13 browser cases pass. The first actual-route run exposed the test’s assumption that replies were open; it now locates the existing reply link in both open and unconfigured states, with the same keyboard-focus assertion. No product validation was bypassed.

## Review

Open `/dev/invitation/letter` with local previews enabled. Check the figure at375/768/1280, sample attribution, names, and keyboard navigation through Kindly reply. The same component appears on authenticated `/i/<token>` invitations.

## UI checklist

PASS: screenshots/crops across all themes and widths; theme tokens; restrained typography; viewport width and44px attribution target; reduced motion; keyboard reply focus; axe/contrast; reserved image space/blur/WebP and measured CLS0; honest sample copy. Feature-specific component reuses existing letter/envelope controls. QR and staff feedback N/A because unchanged. Verification: production build, quick lint/types/21 related tests,13 browser cases pass. Performance95 FAIL (90 measured); physical sharing/devices NOT VERIFIED, retained in release gates under standing preview permission.

## Risks and rollout

The existing stock asset is1600px wide, suitable for this preview but not the final2400px requirement. Roll back this component integration to restore the text-first letter; no migration, dependency, production data or environment change is involved. Physical WhatsApp/device checks remain in the release gates.
