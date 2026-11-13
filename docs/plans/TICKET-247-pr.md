# Ticket

Ticket: TICKET-247

# Summary

The guest visual baselines predate the merged invitation hero, requested ivory/champagne/chocolate palette and lightweight order/offline documents. The editor integration exposed 80 deterministic screenshot differences while 60 cases continued to pass. This reconciles the expected Linux images with those intentional changes.

# Changes

- Update 80 baseline PNGs from the actual Linux runner, retaining the other 60 baselines.
- Record every old/new SHA-256, geometry and originating design change in `docs/reviews/TICKET-247/baseline-review.json`.
- Leave screenshot assertions, route/theme/device coverage, masks, pixel tolerances and CI configuration unchanged.

# Acceptance criteria and evidence

The source is PR #197 head `10055803b17ddbb3f4643b409b04dd529668ec9b`, run `43411506204`, job `131839484742`. Every source expected PNG matches the corresponding committed baseline byte-for-byte. Every first-run actual PNG matches its retry byte-for-byte.

Changes comprise 20 invitation views (TICKET-038 hero), 20 order and 20 offline views (TICKET-081 native documents), and five each of ivory home, invitation entry, lost-link and pass views (TICKET-014 palette). Ivory changes also apply to the first three groups. These are four themes and five device sizes; no case is removed.

Independent representative visual review is clean; a fresh passing CI run remains pending. The source run is failure evidence, not a passing result.

# Verification

- Static provenance: all 80 expected/committed and actual/retry pairs match exactly.
- Visual inspection so far: ivory desktop home/offline/invitation and mobile blush ordering, ivory pass and lost-link; requested colors, labelled stock hero and readable unclipped content are preserved.
- Independent review: all 80 old/new hashes confirmed; desktop ivory home, desktop/mobile invitation, mobile/desktop ordering and desktop/mobile offline expected/actual/diffs inspected. No clipping, missing controls or unintended content loss found. Existing QR masking is unchanged.
- Required final visual comparison and other CI checks: pending.

# Risks and rollout

Baseline changes can hide regressions if accepted blindly. Changes are grouped by merged ticket and recorded individually for independent review. No product code, migration or deployment change is included. Reverting this ticket restores the older images, which intentionally differ from current product output.

# Screenshots

The changed Linux PNGs are the reviewable screenshots. Expected/actual/difference artifacts remain available from the source job's `visual-baselines` artifact. The committed manifest gives exact provenance for every replacement.

# UI checklist

This changes test evidence only. Prior feature checks remain scoped to their original tickets; it does not certify physical devices, provider delivery, fresh Lighthouse scores or release readiness. Screenshot coverage and strict comparison rules remain unchanged. Independent image review and fresh CI are required before completion.

# Harness changes, if any

None. No runner, test, tolerance or CI rule is changed.
