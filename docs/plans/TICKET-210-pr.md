# TICKET-210: Stabilise invitation text during font loading

Centred name text moved horizontally when fallback glyphs were replaced by the chosen display font, despite unchanged block bounds. Preview theme links also moved because their positions depended on changing text widths.

## Changes

- Keep the names in a centred maximum18rem column with a stable left text origin; retain fonts, fluid sizing, wrapping, wording and envelope motion.
- Reserve14rem for each preview theme link so loading a font cannot reposition adjacent links.
- Add delayed-font regressions across all four themes and375/768/1280: require loading state, stable name/link origins and exact zero CLS.
- Expand existing first-visit, replay, return and keyboard assertions to all three widths.
- Include the unchanged TICKET-209 definition solely for contiguous-ID validation, under the approved exception. No209 implementation is included.

## Evidence

Baseline develop c9edef6cb137a194f9c215fc5b61b08488a54aa0 and the existing TICKET-104 build produce identical results across twelve controlled theme/width pairs. Raw geometry, resource timing and shift entries are in docs/reviews/TICKET-210/font-comparison.json.

Unchanged-baseline head5857b5750a48584392892bce2df7d3fc115b94f9 failed CI41279198910 with exactly the same Adaora CLS0.0001711703703703704 in both dark themes, including retries:573passed,135skipped,2failed. This establishes that the regression already exists in develop.

The initial new regression failed12/12 before implementation. Candidate focused suite passed62 checks. Full local verification passed514 unit tests (26skipped) and599 browser tests (135skipped), including the strengthened loading-state/zero-CLS checks. The final expanded replay/keyboard width matrix is being checked separately; final-head Linux CI and Lighthouse remain pending.

## Review

Read docs/reviews/TICKET-210/README.md and its twelve all-theme/width screenshots. Visit /dev/invitation/letter?theme=ivory-gold, then the other themes. Throttle fonts, replay the envelope, navigate to the reply section using the keyboard and check reduced motion.

This is still a draft: performance, final-head CI and physical-device requirements are not certified. Existing release gates remain mandatory. No test threshold, timeout, retry, hook or assertion was weakened.

No schema, dependency, account or data changes. Revert the layout/test commit to roll back; this restores the original font-origin instability.
