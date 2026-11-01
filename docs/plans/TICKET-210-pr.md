# Ticket

TICKET-210 — Eliminate invitation font-swap shifts after integration

# Summary

This initial draft deliberately preserves the merged develop implementation to establish whether its envelope/font combination already produces the layout shift reported by PRs64,65 and66. No fix is claimed.

# Changes

- Published the regression ticket and its acceptance criteria.
- Carried only the unchanged209 definition required by contiguous-ID validation, under the user's exception; no209 implementation is included.
- Recorded the baseline comparison plan and handoff.
- No changes to src, e2e, dependencies, Next configuration or CI configuration at this checkpoint.

# Acceptance criteria and evidence

All criteria remain incomplete. Existing Linux CI on this exact baseline is the first controlled observation. Earlier runs report Adaora as the source and CLS0.0001711703703703704 in dark Playfair themes.

# Verification

Ticket validation passes with210 definitions. Pre-commit quick verification passes. Local and hosted baseline results are pending. The zero-CLS assertions remain unchanged.

# Risks and rollout

Investigation only; do not merge this draft. No migration or deploy change. The original feature PRs remain blocked. No device or performance limitation is waived.

# Screenshots and UI checklist

No UI implementation change yet; screenshots and delayed-font evidence will follow diagnosis. No completion or UI approval is claimed.

# Next steps

Compare develop c9edef6cb137a194f9c215fc5b61b08488a54aa0 against PR104 under controlled font timing; prove causality, add a failing regression and repair the actual cause.

# Harness changes

None.
