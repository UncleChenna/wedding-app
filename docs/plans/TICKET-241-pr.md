# Ticket

TICKET-241; local implementation prerequisite for TICKET-124.

# Summary

Supabase URL configuration previously flowed into CSP after URL parsing alone. That parser accepts wildcard and semicolon hostnames, allowing unintended source expressions. The policy now rejects those forms, non-HTTP(S) schemes and credentials before generating a header, without echoing configuration values.

# Changes

- Validate the connection origin with Zod and exact-host constraints; retain local ports, IPv6 and the corresponding websocket origin.
- Configure client validation before application initialization to avoid Zod's caught evaluation probe under CSP; use a named mini import to preserve tree shaking.
- Preserve all existing script, camera, font, worker, framing and object restrictions.
- Extend the existing browser smoke suite with positive capability checks and explicit unauthorized-script rejection evidence.
- Keep every staging/production acceptance requirement in TICKET-124, adding this implementation as a prerequisite alongside TICKET-149. No deployment ticket is marked complete.

# Acceptance criteria and evidence

Focused tests reproduced five invalid configuration failures; added wildcard/separator cases also failed before the exact-host repair. All 13 policy unit tests now pass. Focused quick verification also passes lint, types and 20 related tests. Six production-browser checks now pass in 7.0 seconds.

# Verification

- Policy unit tests: 13 passed.
- Final production build, including both client entry points: passed.
- Quick verification: lint, types and 20 related tests pass.
- Initial browser audit: both positive cases failed on a real `script-src:eval` event from the compiled Zod probe. Final six mobile/desktop cases pass in 7.0 seconds: normal Next load, actual standalone scanner bundle under delivered CSP, and unauthorized HTTPS/data scripts. No policy or assertion is relaxed.
- Independent policy and startup reviews: no blocking findings. The named mini import retains tree shaking; no Lighthouse improvement is claimed.

# Risks and rollout

An invalid Supabase URL now fails configuration instead of generating a misleading policy. Valid HTTP(S), loopback, IPv6 and explicit ports remain supported. No secrets, dependencies, migrations, RLS, deployment settings or CI workflows change. The standalone browser fixture mounts an expired synthetic shell; it proves bundle initialization policy compatibility, not authenticated admissions or physical camera operation. Existing static `unsafe-inline` remains an explicit ADR tradeoff; this does not claim universal XSS prevention. TICKET-124 retains all HTTPS staging, production grade and post-release evidence. Roll back this isolated validation/test change if valid configuration unexpectedly regresses; do not broaden CSP origins as a workaround.
