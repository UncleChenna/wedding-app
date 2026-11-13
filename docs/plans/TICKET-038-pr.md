# TICKET-038: responsive invitation hero

The personal invitation previously opened with text only. It now has a full-width photograph with reserved responsive dimensions, an immediate blur placeholder and optimized WebP delivery through Next Image. Names, reply navigation, pass and event details retain their existing behavior below it.

The approved stock photograph is visibly identified as a sample and credited to Lauren Mitchell/Unsplash. It is never described as Uchenna and Adaora. A typed optional photo field accepts a saved source, descriptive alt text and blur metadata for the later TICKET-099 editor; this ticket does not add storage or publishing controls. Final photo rights and approval remain TICKET-008 release requirements.

## Evidence

- Missing-component regression reproduced, then12 focused hero/letter/invitation tests passed.
- Quick verification passes lint, TypeScript and21 related unit tests.
- Browser crop/format/layout evidence, production build and independent review remain in progress. No real-device or Lighthouse completion is claimed.

## Review

Open `/dev/invitation/letter` with local previews enabled. Check the figure at375/768/1280, sample attribution, names, and keyboard navigation through Kindly reply. The same component appears on authenticated `/i/<token>` invitations.

## Risks and rollback

The existing stock asset is1600px wide, suitable for this preview but not the final2400px requirement. Roll back this component integration to restore the text-first letter; no migration, dependency, production data or environment change is involved. Physical WhatsApp/device checks remain in the release gates.
