# 0001 — Next.js App Router with Cache Components

- Status: Accepted · 2026-10-21

**Context.** Mobile-first site with mostly static guest pages, some per-guest dynamic pages, staff tools and live boards. Needs server-side rendering for fast first paint on phones and server-only data access.

**Decision.** Next.js 16 App Router, TypeScript strict, React Server Components, Server Actions. Keep the framework defaults: Cache Components + Partial Prefetching on, Turbopack.

**Consequences.** Static shells are prerendered; dynamic data (cookies, DB reads) must sit inside `<Suspense>` or `"use cache"`. APIs differ from older Next versions — agents must read `node_modules/next/dist/docs/` before using an API.
