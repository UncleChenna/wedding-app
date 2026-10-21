# Engineering conventions

- Feature modules have `components/`, `server/`, `lib/`, and `__tests__/`. Import through `@/modules/...`; another feature exposes a public entrypoint, never its server internals.
- App routes contain routing/layout/metadata only. Database access goes through `shared/server/db/client`; all tables default to RLS with no browser policies.
- Unit tests live beside modules; scripts use `scripts/__tests__/`. Browser flows live in `e2e/`; must-never-break flows carry `@smoke`.
- Generated migrations are added, never rewritten after application. Theme schema comes from `pnpm themes:schema`. Installed dependencies, `.next/`, and `supabase/.temp/` are not source.
- Themes use CSS variables and Tailwind token classes; see the design principles and theming guide. Tokens, not component literals, define colours/font families/radii/shadows.
- Every completed task has acceptance evidence, a passing full gate, UI checklist evidence where relevant, updated documentation, a handoff, a conventional commit and reviewed PR.
