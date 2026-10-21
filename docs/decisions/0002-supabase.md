# 0002 — Supabase for Postgres, Auth and Realtime

- Status: Accepted · 2026-10-21

**Context.** Need a relational DB, staff/admin login, and live updates for the kitchen/bar board and dashboard. Must run locally with no cloud account for development.

**Decision.** Supabase. Local stack via the Supabase CLI (installed as a dev dependency, runs in Docker). Use Postgres directly from the server via Drizzle; use `@supabase/ssr` only for Auth sessions and Realtime.

**Consequences.** Docker is required for local DB. Analytics, Edge Functions and vector storage are disabled locally to keep startup fast. Production needs a Supabase project (free tier is enough for 300 guests) — the only account besides GitHub.
