# Current state

Audit of the repository against the [PRD](prd.md) on **2026-10-21**, at commit `2f8dc47` (branch
`chore/agent-collaboration-tooling`, which includes the uncommitted HARNESS-001 and DESIGN-001 work as it stood when
it was committed). The [ticket backlog](../tickets/ROADMAP.md) starts from this state. Update this file when a
fix-up ticket changes a fact recorded here.

## How this was checked

- `pnpm verify` at 06:20 BST: **passed**. Format, lint, typecheck, 52 unit tests in 11 files, production build, 17
  Playwright smoke tests (7 overflow checks are skipped in the desktop project by design).
- Read every file in `docs/`, `.agents/skills/`, `.claude/`, `scripts/`, `src/`, `e2e/`, `supabase/`, `drizzle/`, plus
  `package.json`, configs and `git log --stat` for all four commits.
- Not run: the local Supabase stack (`pnpm db:*`), `pnpm wt:new`/`wt:remove`, `pnpm screenshots`, `pnpm agent:loop`,
  CI on GitHub (the `origin` repository was empty), and anything on a real phone.

## What exists and works

| Area          | What is there                                                                                                                                                                                                                                                                          | Evidence                                                       |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| App skeleton  | Next.js 16.4 App Router, React 19.3, TypeScript strict, Tailwind 4, Cache Components and typed routes; route groups `(guest)`, `(staff)`, `(admin)`                                                                                                                                    | `pnpm verify` build                                            |
| Routes        | `/`, `/invite`, `/order`, `/checkin`, `/kitchen`, `/admin`, `/dev/theme`, themed 404, `error.tsx`, `global-error.tsx`                                                                                                                                                                  | smoke tests                                                    |
| Theming       | JSON themes validated by Zod and a WCAG AA contrast gate at module load; CSS variables rendered on `<html>` on the server (no flash); Tailwind maps utilities to tokens; ESLint bans colour literals; 2 themes (`ivory-gold`, `midnight-champagne`); fonts via `next/font` with `swap` | unit tests `src/modules/theming/__tests__`, smoke `/dev/theme` |
| Base UI       | `Button`, `Card`, `Input`, `Sheet`, `Toast` on theme tokens, shown on `/dev/theme`                                                                                                                                                                                                     | `src/modules/shared/__tests__/ui.test.tsx`                     |
| Cross-cutting | Zod env loader (fails fast), redacting JSON logger, security headers with CSP / HSTS / camera permission                                                                                                                                                                               | unit tests, smoke "security headers are set"                   |
| Data          | Drizzle schema for 10 tables with RLS enabled and no policies, first migration, deterministic seed                                                                                                                                                                                     | `scripts/__tests__/seed-data.test.ts` (seed data shape only)   |
| Quality gates | Vitest, Playwright mobile + desktop smoke, 375px overflow check, Prettier, ESLint zero warnings, Husky + lint-staged + commitlint, CI workflow file                                                                                                                                    | `pnpm verify`                                                  |
| Agent harness | `AGENTS.md` as the single rule source with pointers for Claude, Codex, Cursor, Copilot, Gemini; portable skills in `.agents/skills/`; shared pre/post/stop hooks; managed worktrees with isolated Supabase stacks and ports; plugin packaging; design principles and UI checklist      | `scripts/__tests__/harness.test.ts`, `hooks.test.ts`           |
| Tickets       | This change replaces `docs/tasks.json` and `scripts/task.mjs` with `tickets/` and `pnpm t:*`                                                                                                                                                                                           | `scripts/__tests__/tickets.test.ts`                            |

## What exists but is incomplete

- **Every product route is a placeholder.** `/invite`, `/order`, `/checkin`, `/kitchen` and `/admin` render
  `PagePlaceholder`. No invitation, RSVP, scanner, ordering, board or admin feature exists yet.
- **Feature modules are empty.** `src/modules/{invitations,checkin,ordering,admin}` hold only `.gitkeep` and a README.
- **No authentication.** No Supabase Auth wiring, no admin login, 2FA, staff PIN or route protection.
- **No PWA.** No manifest, icons, service worker, offline page or install prompts.
- **Theming gaps.** The active theme is a code constant (`ACTIVE_THEME_ID`), not stored in the database (THM-2). There
  is no `warning`/amber token, so the fixed green/amber/red staff statuses (THM-4) cannot be built from tokens. No
  `pattern` texture token. Two presets, not 3–4 (THM-5).
- **Database never exercised.** The local stack, migrate-twice and seed-twice idempotency (old SETUP-003) were not
  verified locally; CI's database job has never run.
- **Database bootstrap verified (TICKET-003 update, 2026-10-22).** On a fresh worktree stack, a second
  `pnpm db:migrate` changed nothing (1 migration applied before and after) and two `pnpm db:seed` runs gave
  identical counts (110 invitations, 245 guests, 110 RSVPs, 28 tables, 16 menu items, 18 orders, 39 order items,
  30 check-ins, 4 staff, 2 themes). `pnpm db:check-rls` confirms RLS on all 10 public tables and fails, naming
  the table, when one lacks it.
- **CI exercised (TICKET-004 update, 2026-10-21).** All four required jobs passed on [PR #8](https://github.com/UncleChenna/wedding-app/pull/8), [run 39586928907](https://github.com/UncleChenna/wedding-app/actions/runs/39586928907). The verify job runs exactly `pnpm verify` after setup. CI-only env inputs are documented in `.env.example`; parity regression coverage prevents drift. Branch protection and human approval remain separate work.
- **Old setup tasks still open:** contrast-gate proof (SETUP-002), database bootstrap (SETUP-003), CI parity
  (SETUP-004), `/dev/theme` UI review (SETUP-005). All are migrated into tickets.
- **Collaboration setup unfinished.** `.github/CODEOWNERS` still has `@REPLACE_ME_*` placeholders; branch protection
  is not enabled; the managed worktree lifecycle (`wt:new` → `wt:remove`) has not been proven end to end on this
  machine; `.harness/approved-writes.json` flow has no test.
- **Harness defects found during this audit:**
  - The post-tool hook runs `prettier --write .claude/skills`, which fails on the symlink, so **every** agent tool
    call reports a blocking error.
  - The pre-tool hook rejects _reads_ outside the checkout ("Edit outside this checkout denied"), which breaks reading
    tool output files and the scratchpad.
  - The shell-write guard matches any command containing `sed`/`perl`/`cp`/`>` together with `.env`, `node_modules/`
    or `drizzle/` anywhere in the text, including `process.env` and read-only `cat`. That gives false positives on
    harmless commands.
  - `.claude/skills` is listed in `.gitignore` but committed as a symlink.
- **Attribution.** Commit `2f8dc47` carries a `Co-Authored-By: Claude …` trailer. The new `commit-msg` hook blocks this
  for future commits; history is not rewritten.
- **SPIKE-001 (audit update, 2026-10-21).** The prototype and findings are committed on
  `divine/SPIKE-001-invitation-design` (reviewed at `bb08a21`). The spike is evidence, not production code.
  Its palette, fonts, motion, QR and token findings are mapped in [the backlog audit](../tickets/AUDIT.md)
  to TICKET-011–TICKET-016, TICKET-039, TICKET-044, TICKET-138 and TICKET-170. The historical baseline above is unchanged.

## What contradicts the PRD

| PRD says                                                                                                                                                         | Repository has                                                                                               | Ticket                 |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ---------------------- |
| Invitation has `token` (≥128-bit), `max_tag_alongs`, `status` (draft, sent, rsvp_yes, rsvp_no, revoked), `table_id`, `sent_at` ([data model](prd.md#data-model)) | `invitations.code`, `household_name`, `max_guests`, no status, no revoke, no table                           | TICKET-023             |
| One QR per **invitation**; the invitation is the unit the gate checks                                                                                            | `guests.qr_token` (one QR per guest)                                                                         | TICKET-023             |
| Guest has `meal_choice`, `dietary_notes`, `name`                                                                                                                 | `first_name`/`last_name`, `dietary_requirements`, no meal choice, table on the guest                         | TICKET-023             |
| RSVP has `attending`, `count_attending`; changes are logged                                                                                                      | `rsvps.status` enum + `message`; no change log                                                               | TICKET-023, TICKET-025 |
| CheckIn per invitation with `people_admitted`, `result`, `device_id`, `staff_id`; partial admission; every scan logged including failures                        | `check_ins` per **guest**, unique on `guest_id` (makes partial admission and failed-scan logging impossible) | TICKET-024             |
| Menu categories meal / soft drink / alcohol; `max_per_order`                                                                                                     | `food` / `drink`; no per-item cap                                                                            | TICKET-024             |
| Order statuses Received, Preparing, Served, Cancelled                                                                                                            | adds `ready`                                                                                                 | TICKET-024             |
| Staff roles gate / kitchen / bar / host with `whatsapp_number`, `pin_hash`, `expires_at`, separate from admins                                                   | roles admin / gate / kitchen / bar, email + `auth_user_id`, no PIN                                           | TICKET-024             |
| Personal link `oursite.com/i/<token>`                                                                                                                            | placeholder route `/invite`                                                                                  | TICKET-036             |
| Active theme stored in the database (THM-2)                                                                                                                      | code constant                                                                                                | TICKET-012             |
| Theme file includes a `pattern` texture                                                                                                                          | no pattern token                                                                                             | TICKET-011             |
| Fixed green / amber / red scanner colours (THM-4)                                                                                                                | `success` and `danger` tokens only                                                                           | TICKET-010             |
| WCAG **2.1** AA on guest pages                                                                                                                                   | repo targets WCAG **2.2** AA (stricter; kept)                                                                | n/a                    |

## PRD gaps and the assumptions the backlog makes

Each assumption is reversible. Tickets labelled `human` confirm the ones that need a person.

1. **Wedding date, venue, RSVP lock — changed/confirmed (owner, 2026-10-26).** Uchenna and Adaora, 19 December 2026. Venue, ceremony time, map, dress code and venue time zone are explicitly **TBD**. The approved lock is 00:00 on the wedding day in the configured venue time zone; no UTC lock value exists yet. The former Europe/London assumption is removed. TICKET-101 records draft details; TICKET-042 requires an explicit valid time zone, and TICKET-176 checks actual details before first send. See [approved defaults](prd.md#approved-event-defaults).
2. **Tag-along limit — confirmed (owner, 2026-10-26).** Default 1, editable per invitation. The previous global 0–10 cap was an unconfirmed assumption and is not an approved policy. Per-invitation limits remain validated by the RSVP/settings implementation.
3. **IV token vs signed QR — changed clarification (TICKET-034).** The PRD requires unguessable personal-link tokens and an Ed25519-signed pass verified offline with public keys. Those requirements are retained. The earlier `/i/<token>` versus `/p/<signed-token>` split, payload versioning and revocation protocol remain proposed implementation details for TICKET-056's ADR, not decisions attributed to the owner in this ticket.
4. **Add to Wallet — changed with explicit owner approval (2026-10-26).** Apple/Google Wallet support is deferred for launch. Launch uses the QR webpage, saved screenshot/image, downloadable PDF and the existing offline-pass requirement. The PRD journey is amended accordingly; Wallet has not been implemented or silently considered delivered.
5. **Guest photo at RSVP** (optional in the PRD). Out of v1, not ticketed.
6. **Email.** Email is only for admin login codes; IVs go out through the Share menu. "Email sending" in the
   Invitations milestone is read as the Share menu's `mailto:` option. A transactional provider (Resend) needs an
   account: TICKET-028.
7. **Order alerts.** Recipients and batching are an open question. Assumption: send one message per order when a
   station is quiet; when more than one order arrives within 60 seconds, send one batch per station per minute.
   Recipients are opted-in staff with a WhatsApp number and a kitchen or bar role. WhatsApp Cloud API account setup is
   a human ticket (TICKET-083). Vercel Hobby cron jobs run at most daily, so batching uses a database outbox drained by
   Supabase `pg_cron` or a request-time flush (TICKET-084 ADR).
8. **Orders with food and drinks.** Assumption: the submitted order is split into one ticket per station, so kitchen
   and bar each see only their items. The guest's confirmation shows both.
9. **Abuse limits.** Assumed defaults: at most 3 open orders per table, a 60-second cooldown per table, and the menu
   item's `max_per_order` (default 5). All are editable in settings.
10. **Staff PINs.** Assumption: 6-digit PINs hashed with `scrypt` (`node:crypto`, no native dependency). Five failed
    attempts per device per 10 minutes. PINs expire at 06:00 the day after the wedding.
11. **Admin 2FA.** Supabase Auth email OTP plus TOTP MFA, with an allowlist of admin emails.
12. **Hosting.** Vercel plus Supabase, as the PRD suggests. Accounts and any paid tier are human decisions
    (TICKET-145, TICKET-144).
13. **Service worker library.** Not specified. TICKET-102 writes the ADR, evaluating Serwist against a hand-written
    worker for Next.js 16.
14. **Data retention — confirmed (owner, 2026-10-26).** 90 days after the wedding. TICKET-127 implements the retention mechanism; TICKET-122 still covers privacy wording and other privacy decisions. No deletion has been performed by this decision.
15. **Devices and gate staffing** (open question). Assumption: 3 scanner phones, 2 board tablets, 1 backup device.
    Confirmed by TICKET-055.
16. **Table host role** (optional in the PRD). Ticketed as low priority in `backlog`.
17. **Capacity.** The load test uses the PRD's headroom figures: 350 guests, 3 scanners and 30 tables.

Ticket ids quoted above are fixed. The backlog is generated in one pass, and ids are never reused.
