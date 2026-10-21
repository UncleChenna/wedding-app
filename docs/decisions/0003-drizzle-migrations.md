# 0003 — Drizzle ORM owns schema and migrations

- Status: Accepted · 2026-10-21

**Context.** Supabase CLI and Drizzle both offer migrations. Two systems would drift.

**Decision.** Drizzle is the only migration system. Schema lives in `src/modules/shared/server/db/schema.ts`; `pnpm db:generate` writes SQL to `drizzle/`; `pnpm db:migrate` applies it. `supabase/config.toml` has `[db.migrations]` and `[db.seed]` disabled. Seeding is `pnpm db:seed` (TypeScript, deterministic, local-only). Every table is created with RLS enabled (`.enableRLS()`).

**Consequences.** Typed queries from one schema file. Supabase-specific objects (RLS policies, Realtime publications) are written in Drizzle (`pgPolicy`) or as custom SQL migrations (`drizzle-kit generate --custom`). Never edit an applied migration.
