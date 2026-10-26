# Engineering conventions

- Feature modules have `components/`, `server/`, `lib/`, and `__tests__/`. Import through `@/modules/...`; another feature exposes a public entrypoint, never its server internals.
- App routes contain routing/layout/metadata only. Database access goes through `shared/server/db/client`; all tables default to RLS with no browser policies.
- Unit tests live beside modules; scripts use `scripts/__tests__/`. Browser flows live in `e2e/`; must-never-break flows carry `@smoke`.
- Every page is listed in `e2e/support/routes.ts` (a smoke test fails when a page under `src/app` is missing; dynamic routes need a sample path). `e2e/a11y-routes.spec.ts` scans each route in every theme with axe and fails on **any** WCAG 2.0/2.1/2.2 A or AA violation, whatever its impact. Use `scanA11y` from `e2e/support/axe.ts` for state-specific scans (open dialogs, errors) and `applyTheme` from `e2e/support/theme.ts` to render a page in another theme. Criteria axe cannot judge are covered by manual audits (TICKET-117, TICKET-118).
- Generated migrations are added, never rewritten after application. Theme schema comes from `pnpm themes:schema`. Installed dependencies, `.next/`, and `supabase/.temp/` are not source.
- Themes use CSS variables and Tailwind token classes; see the design principles and theming guide. Tokens, not component literals, define colours/font families/radii/shadows.
- Every completed task has acceptance evidence, a passing full gate, UI checklist evidence where relevant, updated documentation, a handoff, ticket-prefixed commits (`TICKET-NNN: …`) with no AI attribution, and a reviewed PR. Work is tracked in [tickets](tickets.md).

- Server Actions use `runLoggedAction` from `shared/server/action-logger` for per-request correlation and safe lifecycle logs. See [request-scoped logging](observability.md); never log raw inputs or exception text.
