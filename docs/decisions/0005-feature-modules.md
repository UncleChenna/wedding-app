# 0005 — Code organised by feature module

- Status: Accepted · 2026-10-21

**Context.** Four product areas built by several agents in parallel; changes should stay local and easy to review.

**Decision.** `src/modules/{invitations,checkin,ordering,admin,theming,shared}`, each with `components/`, `server/`, `lib/`, `__tests__/`. `src/app` only routes. Modules never import from `src/app` (ESLint enforced).

**Consequences.** A task usually touches one module plus a route file. Shared code must earn its place in `shared/`.
