# HARNESS-002 — Independent backlog audit

Reviewed 2026-10-21 against backlog base `07b6a46512bc29ce85fac17c76d090fee80bce00` on `chore/ticket-system`. Read all 168 original tickets, ROADMAP, PRD and current-state; reviewed all 17 additions. The spike findings were read directly from `divine/SPIKE-001-invitation-design` at `bb08a21` (`git show <branch>:spikes/invitation/FINDINGS.md`). No spike/product code was merged.

## Outcome and unresolved decisions

All 36 numbered requirements have explicit ticket coverage. Coverage means planned work, not implementation or acceptance. There were no baseline dependency cycles; the principal defects were semantic ordering, overloaded scope and missing failure cases. Added WED-169–WED-185 with `pnpm t:new`; all original statuses/claims remain unchanged. WED-178 is optional backlog; other additions are todo.

- Wallet remains a genuine scope decision: WED-034 must obtain an approved PRD amendment or create implementation/account tickets and block WED-176 on them. It is not declared delivered or silently dropped.
- INV-2 signed pass URL versus IV-link wording and INV-7 immediate revocation versus CHK-6 disconnected operation need the explicit WED-169 decision. No technical implementation can revoke a token on a device that has received no new information.
- The approved primary palette is ivory + champagne gold + chocolate brown. Photo rights, dates, accounts, provider consent and actual device/venue results are still pending humans.

## Gaps and fixes

| Finding | Fix |
| --- | --- |
| Invitation sending waited for the full wedding-day app | WED-176/177 early release/import; WED-159 no longer waits for full menu/scanner launch. |
| Offline queue included server merge; logging/history prerequisites incomplete | WED-173 server reconciliation, WED-174 history; WED-062/066 narrowed and rewired. |
| One schema ticket covered too many domains | WED-024 admission schema only; WED-171 menu/order and WED-172 staff/device migrations. |
| CSV import, uploads and theme activation hid backend work inside UI tickets | WED-182/175/181; WED-091/099/098 reduced to M UI scopes. |
| Signed QR destination was assumed, not implemented explicitly | WED-183 read-only resolver and WED-169 authority decision. |
| Update/privacy behavior could lose queued scans or leak cached guest data | WED-180 upgrade compatibility, WED-184 expiry/eviction and tighter WED-105/107/111. |
| Backups were conflated with proven recovery | WED-151 configuration only; WED-179 isolated database+asset restore; WED-153 safe app rollback. |
| Early launch lacked endpoint abuse protection | WED-185 shared invitation/PIN limiter; WED-123 ordering extension later. |
| Optional portrait was silently omitted | WED-178 explicit optional backlog with consent and retention. |
| Mandatory alerts could strand the final batch | WED-084 scheduled drain with no incoming traffic; WED-085 waits for opt-in WED-086. |
| Guest ordering could be blocked by blanket staff guards | WED-032 explicit guest/anonymous authorization matrix; WED-075 private-field exclusions. |
| Re-sharing could reset RSVP; offline counts could imply impossible consistency | WED-051/159 separate send history; WED-136/173 distinguish physical reports from canonical admission counts. |
| Device/install/security gates followed production; obsolete PWA score | WED-114/138/124 staging prerequisites; WED-103/113/154 use actual install tests. |
| Privacy deletion waited for optional memories delivery | WED-168 independent deadline; WED-127 covers logs, media, caches and backup expiry. |

## Requirement traceability

`gap?` reports the audit disposition. Audit-local identifiers below the numbered table identify unnumbered PRD clauses and requested PWA/deployment checks; they are not invented official PRD IDs.

| PRD requirement id | Ticket ids | Gap? |
| --- | --- | --- |
| INV-1 | WED-023, WED-090, WED-091, WED-177, WED-182 | Fixed: transactional import split and early real guest load. |
| INV-2 | WED-036, WED-056, WED-169, WED-183 | Decision pending: IV-link wording versus read-only signed pass URL (169). |
| INV-3 | WED-049, WED-050, WED-051, WED-052, WED-159 | No missing ticket; acceptance and dependencies reviewed. |
| INV-4 | WED-034, WED-040, WED-041, WED-090 | No missing ticket; acceptance and dependencies reviewed. |
| INV-5 | WED-044, WED-045, WED-046, WED-048, WED-183 | Fixed: signed URL resolver and early release gate. Wallet is separate below. |
| INV-6 | WED-042, WED-100, WED-101 | No missing ticket; acceptance and dependencies reviewed. |
| INV-7 | WED-043, WED-065, WED-169, WED-183 | PRD conflict pending owner decision: disconnected devices cannot see immediate revocation (169). |
| INV-8 | WED-053, WED-054 | No missing ticket; acceptance and dependencies reviewed. |
| CHK-1 | WED-055, WED-057, WED-059 | No missing ticket; acceptance and dependencies reviewed. |
| CHK-2 | WED-058, WED-060, WED-061, WED-137 | No missing ticket; acceptance and dependencies reviewed. |
| CHK-3 | WED-058, WED-061, WED-173 | No missing ticket; acceptance and dependencies reviewed. |
| CHK-4 | WED-063, WED-065 | No missing ticket; acceptance and dependencies reviewed. |
| CHK-5 | WED-024, WED-062, WED-064, WED-066, WED-173, WED-174 | Fixed: all-result logging, server merge and admin history; staff identity replaces raw PIN logging. |
| CHK-6 | WED-056, WED-057, WED-065, WED-066, WED-067, WED-108, WED-136, WED-169, WED-173, WED-180, WED-184 | Fixed tracking: atomic merge, stale-list policy, upgrades and private-cache lifecycle. Policy still pending (169). |
| CHK-7 | WED-033, WED-068, WED-137 | No missing ticket; acceptance and dependencies reviewed. |
| ORD-1 | WED-070, WED-094 | No missing ticket; acceptance and dependencies reviewed. |
| ORD-2 | WED-071, WED-095, WED-171 | No missing ticket; acceptance and dependencies reviewed. |
| ORD-3 | WED-072, WED-074, WED-075, WED-081 | No missing ticket; acceptance and dependencies reviewed. |
| ORD-4 | WED-074, WED-076, WED-077, WED-084, WED-171 | No missing ticket; acceptance and dependencies reviewed. |
| ORD-5 | WED-078, WED-079 | No missing ticket; acceptance and dependencies reviewed. |
| ORD-6 | WED-072, WED-073, WED-123 | No missing ticket; acceptance and dependencies reviewed. |
| ORD-7 | WED-080, WED-166 | No missing ticket; acceptance and dependencies reviewed. |
| ORD-8 | WED-032, WED-070, WED-072, WED-123 | Fixed: route guards explicitly preserve anonymous ordering. |
| ORD-9 | WED-083, WED-084, WED-085, WED-086, WED-087 | Fixed: durable final batch without new traffic and opt-in before sending. |
| ADM-1 | WED-089, WED-090, WED-091, WED-092, WED-182 | No missing ticket; acceptance and dependencies reviewed. |
| ADM-2 | WED-093, WED-094, WED-160 | No missing ticket; acceptance and dependencies reviewed. |
| ADM-3 | WED-097 | No missing ticket; acceptance and dependencies reviewed. |
| ADM-4 | WED-031, WED-095, WED-096, WED-172 | No missing ticket; acceptance and dependencies reviewed. |
| ADM-5 | WED-098, WED-099, WED-175, WED-181 | Split upload pipeline/editor and theme persistence/UI. |
| THM-1 | WED-011, WED-013, WED-020, WED-037, WED-046, WED-047, WED-060, WED-094, WED-135, WED-170 | Fixed: dedicated QR and accessible accent tokens; canonical mapping. |
| THM-2 | WED-012, WED-181 | No missing ticket; acceptance and dependencies reviewed. |
| THM-3 | WED-009, WED-098, WED-170, WED-181 | Fixed: backend rejection/atomic activation separated from UI. |
| THM-4 | WED-010, WED-060, WED-170 | No missing ticket; acceptance and dependencies reviewed. |
| THM-5 | WED-013, WED-014 | Fixed: spike preset names and font pairings explicitly specified. |
| THM-6 | WED-098, WED-181 | No missing ticket; acceptance and dependencies reviewed. |
| THM-7 | WED-022 | No missing ticket; acceptance and dependencies reviewed. |
| JOURNEY-WALLET — Save to Apple/Google Wallet | WED-034, WED-176 | Decision gap remains: explicit scope amendment or implementation tickets required before invitation release. |
| JOURNEY-PHOTO — Optional gate identification portrait | WED-178, WED-175 | Tracked as optional backlog; disabled pending consent/approval. |
| SEC-TOKEN — Random 128-bit tokens; signature/public-key-only verifier | WED-036, WED-056, WED-057, WED-169, WED-183 | Covered; URL and freshness contract pending 169. |
| SEC-SHARING — Forwarded screenshots limited per seat; name/first-use time | WED-058, WED-060, WED-061, WED-173 | Covered; disconnected over-admission retained as conflict. |
| SEC-ACCESS — PIN, role permissions, expiry, admin OTP and 2FA | WED-027, WED-028, WED-029, WED-030, WED-031, WED-032, WED-096, WED-125, WED-172 | Covered; guards revised to preserve guest access. |
| SEC-RATE — IV/pass, PIN and order rate limits across instances | WED-185, WED-123, WED-073 | Fixed: launch protection no longer waits for ordering. |
| SEC-HEADERS — Security hardening, secrets, rotation, review | WED-124, WED-125, WED-129, WED-148 | Covered; staging checks precede production. |
| PERF-SCAN — Sub-second scan, two-second board propagation | WED-057, WED-061, WED-068, WED-075, WED-137 | Covered; realistic device/load evidence required. |
| PERF-LOAD — 350 guests, 3 scanners/45 minutes, 30 tables/5 minutes | WED-026, WED-130, WED-137 | Covered; workload now explicit. |
| OPS-PRINT — Morning guest list; spare devices, power, on-call | WED-069, WED-143, WED-161, WED-165 | Covered. |
| OPS-NETWORK — Router, external antenna, backup SIM; Wi-Fi on table cards | WED-094, WED-155, WED-160, WED-161, WED-162 | Covered; credentials kept out of git. |
| OPS-FALLBACK — Scanners offline; staff enter orders when guest disconnected | WED-066, WED-079, WED-082, WED-108, WED-161 | Covered; manual board order entry is 79; table-host mode 82 optional. |
| OPS-VENUE — Venue visit before week 6; actual lighting/4G/Wi-Fi tests | WED-055, WED-155, WED-162, WED-163 | Covered; date must be set by owner. |
| PERF-ORDER — Under 200KB; automatic retry and honest sending state | WED-071, WED-072, WED-081, WED-116 | Covered; idempotency added for safe retry. |
| PRIVACY-MIN — Only needed data; dietary notes admin/kitchen only | WED-023, WED-027, WED-075, WED-126, WED-128, WED-184 | Fixed projection contract and cache exclusions. |
| PRIVACY-NOTICE — RSVP privacy notice and approved retention deadline | WED-034, WED-126, WED-127, WED-168 | Covered; retention independent of memories delivery. |
| PRIVACY-STORES — Delete uploads, exports, logs, backups and private caches | WED-127, WED-151, WED-168, WED-175, WED-184 | Fixed multi-store lifecycle and append-only exception. |
| UX-DEVICES — Older Android/iPhone, no-install camera/browser journeys | WED-055, WED-057, WED-059, WED-114, WED-118, WED-138 | Covered with physical sign-offs. |
| UX-AA — WCAG AA, arm-length statuses, 44px targets and focus | WED-010, WED-017, WED-019, WED-021, WED-060, WED-115, WED-117, WED-118 | Fixed: AA failures cannot pass because severity is moderate. |
| DESIGN-RESPONSIVE — 375px-first, safe areas, no overflow, tablet/desktop | WED-017, WED-021, WED-037, WED-135 | Covered; long names and all themes explicit. |
| DESIGN-HERO — Full-bleed photo, display serif, envelope, reduced motion | WED-015, WED-016, WED-037, WED-038, WED-039, WED-119 | Fixed exact font/motion recommendations from spike. |
| DESIGN-WHATSAPP — Photo OG preview, saving QR/camera in in-app browser | WED-045, WED-047, WED-057, WED-138 | Covered; staging tests before first send. |
| DESIGN-FAST — 95+ performance/accessibility, AVIF/WebP, next/font | WED-015, WED-115, WED-116, WED-119, WED-120 | Covered; obsolete PWA Lighthouse check removed. |
| DESIGN-LIBRARY — Single token component library; plain staff screens | WED-009, WED-010, WED-011, WED-017, WED-018, WED-019, WED-020, WED-021 | Covered. |
| DESIGN-VISUAL — Every guest page/theme at SE, iPhone15, Android, iPad, desktop | WED-021, WED-135, WED-138 | Covered; screenshot sizes do not replace real-device proof. |
| DESIGN-CLS — CLS 0, no console errors, image alt text | WED-115, WED-116, WED-119, WED-120, WED-121 | Covered. |
| DATA-INVITATION — Invitation, Guest and RSVP entities | WED-023, WED-025, WED-036, WED-040, WED-041 | Covered; status versus sent timestamp corrected. |
| DATA-CHECKIN — CheckIn sum bounded by RSVP; immutable attempts | WED-024, WED-058, WED-061, WED-173 | Fixed canonical admissions versus reported offline evidence. |
| DATA-TABLE — Table number/name/capacity and seating | WED-023, WED-070, WED-093 | Covered. |
| DATA-ORDER — MenuItem, Order, OrderItem, categories/stations/caps | WED-171, WED-072, WED-074, WED-095 | Split from overloaded WED-024. |
| DATA-STAFF — Staff identity, role, WhatsApp, PIN hash/expiry | WED-172, WED-031, WED-086, WED-096 | Split from overloaded WED-024. |
| STACK — Next/TypeScript, Supabase, ORM, QR/PDF, SMTP, monitoring | WED-003, WED-023, WED-027, WED-028, WED-033, WED-046, WED-056, WED-057, WED-122, WED-139, WED-144, WED-145 | Covered; technology suggestions are not mandatory paid-service approvals. |
| PWA-CHOICE — Choose worker strategy and document lifecycle | WED-102, WED-105 | Covered. |
| PWA-INSTALL — Manifest/icons, iOS guidance, Android prompt, standalone | WED-103, WED-104, WED-109, WED-110, WED-113, WED-114 | Fixed actual installability checks; no Lighthouse PWA score. |
| PWA-OFFLINE — Offline fallback, own QR pass, cached scanner | WED-106, WED-107, WED-108, WED-136, WED-184 | Fixed privacy/eviction/expiry acceptance. |
| PWA-UPDATE — Update prompt without losing unsynced scans | WED-111, WED-180 | Fixed cross-version queue/migration tests. |
| PWA-PUSH — Optional staff web-push enhancement | WED-112 | Tracked, not a PRD Must or launch prerequisite. |
| DEPLOY-ACCOUNTS — Vercel/Supabase/domain/SMTP human setup and isolation | WED-028, WED-139, WED-144, WED-145, WED-146, WED-147, WED-149 | Human work reprioritized before dependent release work. |
| DEPLOY-SAFETY — Environment, migrations, smoke, monitoring and uptime | WED-140, WED-141, WED-142, WED-143, WED-148, WED-150, WED-152 | Covered; alert setup before go/no-go. |
| DEPLOY-RECOVERY — Database AND asset backups, timed restore, rollback | WED-151, WED-153, WED-179, WED-180 | Fixed: separate backup/restore; app rollback must preserve new writes. |
| MILESTONE-FOUNDATION — Week1 repo/auth/schema/import/themes | WED-001, WED-003, WED-004, WED-005, WED-007, WED-009, WED-017, WED-023, WED-029, WED-030, WED-091 | Covered; estimates are relative, not delivery promises. |
| MILESTONE-INVITE — Weeks2–3 invitation release and send | WED-176, WED-177, WED-158, WED-159 | Fixed: no full gate/order implementation dependency. |
| MILESTONE-GATE — Weeks4–5 gate/offline/multi-device | WED-059, WED-061, WED-063, WED-066, WED-068, WED-174 | Covered. |
| MILESTONE-ORDER — Weeks5–6 boards/menu/abuse/table cards | WED-070, WED-073, WED-078, WED-085, WED-094, WED-095, WED-154 | Covered. |
| MILESTONE-HARDEN — Week7 offline/load/security/privacy tests | WED-126, WED-129, WED-136, WED-137 | Covered; repeat invitation-specific checks at early release. |
| MILESTONE-REHEARSE — Staff 10-minute walkthrough, venue rehearsal, freeze ≥14 days | WED-156, WED-162, WED-163, WED-164, WED-165 | Covered; actual date and schedule remain human decisions. |
| POST-EVENT — Close ordering/PINs, memories, retention | WED-166, WED-167, WED-168 | Fixed: build closure before release; retention does not wait for export. |
| COPY-SHARE — Warm/playful/formal WhatsApp, email subject/body | WED-035, WED-050, WED-052, WED-158 | Covered; selected voice must preserve approved strings. |
| COPY-REMIND — RSVP nudge and day-before wording | WED-052, WED-053, WED-054, WED-158 | Covered; reminders are Could. |
| COPY-SITE — Invite, RSVP, pass, scanner and order wording | WED-035, WED-037, WED-040, WED-044, WED-060, WED-075, WED-158, WED-164 | Covered; early and full-release proofreading separated. |
| DECISIONS — Date/venue/photos/domain, limits, staff, network, provider | WED-008, WED-034, WED-035, WED-055, WED-083, WED-122, WED-144, WED-145, WED-149, WED-155, WED-169 | Still require actual owner decisions; tickets are not approval. |

## Spike adoption

| Finding from committed spike | Backlog action |
| --- | --- |
| Ivory #FFF9EF / champagne #D6BE8D / chocolate #432B22 | WED-008 records already-selected palette; WED-014 and WED-170 implement it. Champagne is not body text. |
| Cormorant Garamond + Inter; Playfair Display + Inter; Cormorant Garamond + Jost | WED-013 preset pairings; WED-015 self-hosting/metrics; WED-120 CLS verification. |
| Separate accessible accent foreground and QR paper/ink; four-module quiet zone | WED-170 schema/presets; WED-044 and WED-183 realistic signed payload and device scans. |
| Canonical schema differs from illustrative PRD names; texture needs restraint | WED-011 mapping and optional scale/placement/strength; do not add a parallel token system. |
| 600ms reveal, 180ms controls, reduced motion none or ≤150ms fade | WED-016/039 explicit durations and keyboard/return-visit tests. |
| Fixed semantic colours; long names; returning guest bypass | WED-013/037/039/060 and WED-170. |
| 153 prototype screenshots do not prove WhatsApp or production QR behavior | WED-138 physical staging tests and WED-044/057 actual signed payload scans. |

The spike recommends changes; it does not authorize silently rewriting PRD scope. Production changes remain future tickets.

## Change inventory

Added 17 tickets: WED-169–WED-185. Substantively revised 136 original tickets: WED-003, WED-004, WED-005, WED-008, WED-009, WED-010, WED-011, WED-012, WED-013, WED-014, WED-015, WED-016, WED-017, WED-018, WED-019, WED-020, WED-021, WED-023, WED-024, WED-025, WED-026, WED-027, WED-028, WED-029, WED-030, WED-031, WED-032, WED-034, WED-035, WED-037, WED-038, WED-039, WED-040, WED-041, WED-042, WED-043, WED-044, WED-045, WED-046, WED-047, WED-048, WED-049, WED-051, WED-052, WED-053, WED-054, WED-055, WED-056, WED-057, WED-058, WED-059, WED-060, WED-061, WED-062, WED-063, WED-064, WED-065, WED-066, WED-067, WED-068, WED-070, WED-071, WED-072, WED-073, WED-074, WED-075, WED-076, WED-078, WED-079, WED-080, WED-081, WED-083, WED-084, WED-085, WED-086, WED-088, WED-089, WED-090, WED-091, WED-092, WED-094, WED-095, WED-096, WED-098, WED-099, WED-101, WED-102, WED-103, WED-105, WED-107, WED-108, WED-111, WED-113, WED-114, WED-115, WED-116, WED-117, WED-118, WED-119, WED-120, WED-122, WED-123, WED-124, WED-125, WED-126, WED-127, WED-128, WED-129, WED-131, WED-133, WED-134, WED-136, WED-137, WED-138, WED-139, WED-140, WED-142, WED-144, WED-145, WED-146, WED-147, WED-148, WED-149, WED-150, WED-151, WED-152, WED-153, WED-154, WED-157, WED-158, WED-159, WED-160, WED-161, WED-164, WED-166, WED-168. Additional original files change only because the CLI regenerated inverse dependency links.

## Ticket-by-ticket quality review

Every original ticket was checked for observable acceptance criteria, a verification method, bounded size and prerequisites. All estimates are S/M/L. “Retained” means no substantive defect found for that bounded task, not proof it is implemented. New and revised tickets require future tests/evidence. WED-117/118 are bounded audits: larger discovered fixes must become separate release-blocking tickets, rather than an unlimited L implementation. Physical approval work is labelled human.

| Ticket | Size | Disposition |
| --- | --- | --- |
| [WED-001](WED-001-fix-hooks-failing-on-the-symlinked-claude-skills.md) | S | Retained after review; generated inverse links may change |
| [WED-002](WED-002-allow-reads-outside-the-checkout-and-fix-shell-g.md) | S | Retained after review; generated inverse links may change |
| [WED-003](WED-003-verify-database-bootstrap-is-idempotent.md) | M | Revised acceptance, scope, prerequisites or human priority |
| [WED-004](WED-004-get-the-first-green-ci-run-and-confirm-parity-wi.md) | S | Revised acceptance, scope, prerequisites or human priority |
| [WED-005](WED-005-replace-codeowners-placeholders-and-enable-branc.md) | S | Revised acceptance, scope, prerequisites or human priority |
| [WED-006](WED-006-prove-the-managed-worktree-lifecycle-end-to-end.md) | M | Retained after review; generated inverse links may change |
| [WED-007](WED-007-prove-ticket-claims-across-two-clones-against-gi.md) | S | Retained after review; generated inverse links may change |
| [WED-008](WED-008-decide-domain-wedding-colours-and-photos-for-the.md) | S | Revised acceptance, scope, prerequisites or human priority |
| [WED-009](WED-009-prove-the-theme-contrast-gate-end-to-end.md) | S | Revised acceptance, scope, prerequisites or human priority |
| [WED-010](WED-010-add-fixed-semantic-status-tokens-for-valid-used.md) | M | Revised acceptance, scope, prerequisites or human priority |
| [WED-011](WED-011-align-theme-files-with-the-prd-pattern-texture-a.md) | M | Revised acceptance, scope, prerequisites or human priority |
| [WED-012](WED-012-store-the-active-theme-in-the-database-and-apply.md) | M | Revised acceptance, scope, prerequisites or human priority |
| [WED-013](WED-013-ship-third-and-fourth-preset-themes.md) | M | Revised acceptance, scope, prerequisites or human priority |
| [WED-014](WED-014-create-the-couple-s-theme-from-their-colours-and.md) | S | Revised acceptance, scope, prerequisites or human priority |
| [WED-015](WED-015-define-the-typography-scale-and-font-roles.md) | M | Revised acceptance, scope, prerequisites or human priority |
| [WED-016](WED-016-add-motion-primitives-that-honour-reduced-motion.md) | M | Revised acceptance, scope, prerequisites or human priority |
| [WED-017](WED-017-harden-base-components-for-focus-tap-targets-and.md) | L | Revised acceptance, scope, prerequisites or human priority |
| [WED-018](WED-018-add-form-components-for-rsvp-ordering-and-admin.md) | M | Revised acceptance, scope, prerequisites or human priority |
| [WED-019](WED-019-add-staff-status-panels-and-badges-for-arm-s-len.md) | S | Revised acceptance, scope, prerequisites or human priority |
| [WED-020](WED-020-add-theme-driven-dividers-monogram-and-paper-tex.md) | S | Revised acceptance, scope, prerequisites or human priority |
| [WED-021](WED-021-ui-review-of-dev-theme-in-every-theme-and-width.md) | S | Revised acceptance, scope, prerequisites or human priority |
| [WED-022](WED-022-generate-a-full-palette-from-one-or-two-seed-col.md) | M | Retained after review; generated inverse links may change |
| [WED-023](WED-023-redesign-invitation-guest-and-rsvp-tables-to-mat.md) | L | Revised acceptance, scope, prerequisites or human priority |
| [WED-024](WED-024-redesign-check-in-menu-order-and-staff-tables-to.md) | M | Revised acceptance, scope, prerequisites or human priority |
| [WED-025](WED-025-add-event-settings-and-rsvp-change-log-tables.md) | M | Revised acceptance, scope, prerequisites or human priority |
| [WED-026](WED-026-rebuild-deterministic-seed-data-for-the-new-sche.md) | M | Revised acceptance, scope, prerequisites or human priority |
| [WED-027](WED-027-write-the-rls-adr-and-least-privilege-policies.md) | M | Revised acceptance, scope, prerequisites or human priority |
| [WED-028](WED-028-set-up-the-email-provider-for-admin-login-codes.md) | S | Revised acceptance, scope, prerequisites or human priority |
| [WED-029](WED-029-add-admin-sign-in-with-email-codes-and-an-allowl.md) | M | Revised acceptance, scope, prerequisites or human priority |
| [WED-030](WED-030-require-totp-two-factor-auth-for-admin-accounts.md) | M | Revised acceptance, scope, prerequisites or human priority |
| [WED-031](WED-031-add-staff-pin-sign-in-with-hashed-expiring-pins.md) | M | Revised acceptance, scope, prerequisites or human priority |
| [WED-032](WED-032-protect-admin-and-staff-routes-in-the-request-pr.md) | M | Revised acceptance, scope, prerequisites or human priority |
| [WED-033](WED-033-set-up-realtime-channels-for-boards-and-scanners.md) | M | Retained after review; generated inverse links may change |
| [WED-034](WED-034-decide-wedding-date-rsvp-lock-tag-along-limit-an.md) | S | Revised acceptance, scope, prerequisites or human priority |
| [WED-035](WED-035-choose-the-invitation-voice-and-approve-guest-fa.md) | S | Revised acceptance, scope, prerequisites or human priority |
| [WED-036](WED-036-generate-invitation-tokens-and-the-personal-i-to.md) | M | Retained after review; generated inverse links may change |
| [WED-037](WED-037-build-the-iv-page-with-names-date-venue-dress-co.md) | L | Revised acceptance, scope, prerequisites or human priority |
| [WED-038](WED-038-add-the-full-bleed-hero-photo-with-blur-placehol.md) | M | Revised acceptance, scope, prerequisites or human priority |
| [WED-039](WED-039-add-the-envelope-opening-reveal-with-reduced-mot.md) | M | Revised acceptance, scope, prerequisites or human priority |
| [WED-040](WED-040-build-the-rsvp-form-for-attending-yes-or-no.md) | M | Revised acceptance, scope, prerequisites or human priority |
| [WED-041](WED-041-let-guests-add-tag-alongs-with-meals-and-dietary.md) | L | Revised acceptance, scope, prerequisites or human priority |
| [WED-042](WED-042-lock-rsvp-edits-on-the-wedding-day-and-log-every.md) | M | Revised acceptance, scope, prerequisites or human priority |
| [WED-043](WED-043-revoke-and-reissue-invitations-so-old-links-and.md) | M | Revised acceptance, scope, prerequisites or human priority |
| [WED-044](WED-044-show-the-guest-s-qr-pass-after-they-rsvp-yes.md) | M | Revised acceptance, scope, prerequisites or human priority |
| [WED-045](WED-045-let-guests-save-their-pass-as-an-image.md) | M | Revised acceptance, scope, prerequisites or human priority |
| [WED-046](WED-046-offer-a-printable-pdf-invitation-with-the-qr.md) | L | Revised acceptance, scope, prerequisites or human priority |
| [WED-047](WED-047-add-open-graph-previews-for-iv-links-without-gue.md) | M | Revised acceptance, scope, prerequisites or human priority |
| [WED-048](WED-048-let-guests-request-their-link-again.md) | M | Revised acceptance, scope, prerequisites or human priority |
| [WED-049](WED-049-normalise-guest-phone-numbers-for-wa-me-links.md) | S | Revised acceptance, scope, prerequisites or human priority |
| [WED-050](WED-050-build-the-share-menu-whatsapp-email-copy-link-an.md) | M | Retained after review; generated inverse links may change |
| [WED-051](WED-051-mark-invitations-as-sent-when-shared.md) | S | Revised acceptance, scope, prerequisites or human priority |
| [WED-052](WED-052-fill-share-messages-from-the-prd-wording-templat.md) | S | Revised acceptance, scope, prerequisites or human priority |
| [WED-053](WED-053-show-a-reminder-list-and-re-share-nudges-to-non.md) | M | Revised acceptance, scope, prerequisites or human priority |
| [WED-054](WED-054-prepare-the-day-before-pass-reminder-batch.md) | S | Revised acceptance, scope, prerequisites or human priority |
| [WED-055](WED-055-decide-who-runs-the-gate-and-boards-and-on-which.md) | S | Revised acceptance, scope, prerequisites or human priority |
| [WED-056](WED-056-sign-gate-pass-tokens-with-ed25519-and-document.md) | M | Revised acceptance, scope, prerequisites or human priority |
| [WED-057](WED-057-verify-gate-tokens-on-the-scanner-device.md) | M | Revised acceptance, scope, prerequisites or human priority |
| [WED-058](WED-058-implement-admission-rules-and-partial-admission.md) | M | Revised acceptance, scope, prerequisites or human priority |
| [WED-059](WED-059-build-the-scanner-page-with-camera-qr-reading.md) | L | Revised acceptance, scope, prerequisites or human priority |
| [WED-060](WED-060-show-scan-results-within-one-second-with-sound-a.md) | M | Revised acceptance, scope, prerequisites or human priority |
| [WED-061](WED-061-admit-arriving-guests-with-partial-counts.md) | M | Revised acceptance, scope, prerequisites or human priority |
| [WED-062](WED-062-log-every-scan-with-time-device-staff-and-result.md) | S | Revised acceptance, scope, prerequisites or human priority |
| [WED-063](WED-063-add-manual-search-and-check-in-by-guest-name.md) | M | Revised acceptance, scope, prerequisites or human priority |
| [WED-064](WED-064-register-and-name-scanner-and-board-devices.md) | S | Revised acceptance, scope, prerequisites or human priority |
| [WED-065](WED-065-cache-the-guest-list-and-revocations-on-each-sca.md) | L | Revised acceptance, scope, prerequisites or human priority |
| [WED-066](WED-066-queue-offline-check-ins-and-sync-them-when-signa.md) | M | Revised acceptance, scope, prerequisites or human priority |
| [WED-067](WED-067-flag-and-resolve-double-entries-from-offline-sca.md) | M | Revised acceptance, scope, prerequisites or human priority |
| [WED-068](WED-068-sync-check-ins-across-scanners-within-two-second.md) | M | Revised acceptance, scope, prerequisites or human priority |
| [WED-069](WED-069-export-a-printable-gate-guest-list.md) | S | Retained after review; generated inverse links may change |
| [WED-070](WED-070-start-the-order-page-by-typing-and-validating-a.md) | M | Revised acceptance, scope, prerequisites or human priority |
| [WED-071](WED-071-show-the-menu-by-category-with-live-sold-out-sta.md) | M | Revised acceptance, scope, prerequisites or human priority |
| [WED-072](WED-072-submit-orders-with-quantities-note-and-honest-re.md) | L | Revised acceptance, scope, prerequisites or human priority |
| [WED-073](WED-073-enforce-order-limits-per-table-cooldown-and-item.md) | M | Revised acceptance, scope, prerequisites or human priority |
| [WED-074](WED-074-route-order-items-to-kitchen-and-bar-stations.md) | M | Revised acceptance, scope, prerequisites or human priority |
| [WED-075](WED-075-show-guests-live-status-for-their-order.md) | M | Revised acceptance, scope, prerequisites or human priority |
| [WED-076](WED-076-build-the-kitchen-board-with-oldest-first-live-o.md) | L | Revised acceptance, scope, prerequisites or human priority |
| [WED-077](WED-077-add-the-bar-board-using-the-shared-board-compone.md) | S | Retained after review; generated inverse links may change |
| [WED-078](WED-078-let-staff-move-orders-through-received-preparing.md) | M | Revised acceptance, scope, prerequisites or human priority |
| [WED-079](WED-079-let-staff-enter-an-order-for-a-table-from-the-bo.md) | M | Revised acceptance, scope, prerequisites or human priority |
| [WED-080](WED-080-open-and-close-ordering-on-admin-command.md) | S | Revised acceptance, scope, prerequisites or human priority |
| [WED-081](WED-081-keep-the-order-page-under-200-kb-and-fast-on-slo.md) | M | Revised acceptance, scope, prerequisites or human priority |
| [WED-082](WED-082-add-the-optional-table-host-view-for-a-section-s.md) | M | Retained after review; generated inverse links may change |
| [WED-083](WED-083-set-up-the-whatsapp-alert-number-and-confirm-rec.md) | S | Revised acceptance, scope, prerequisites or human priority |
| [WED-084](WED-084-queue-order-alerts-in-an-outbox-and-batch-them-p.md) | M | Revised acceptance, scope, prerequisites or human priority |
| [WED-085](WED-085-send-alerts-through-the-whatsapp-cloud-api-with.md) | M | Revised acceptance, scope, prerequisites or human priority |
| [WED-086](WED-086-manage-alert-opt-ins-and-recipients-per-station.md) | S | Revised acceptance, scope, prerequisites or human priority |
| [WED-087](WED-087-show-alert-delivery-health-on-the-boards.md) | S | Retained after review; generated inverse links may change |
| [WED-088](WED-088-build-the-admin-shell-and-navigation.md) | M | Revised acceptance, scope, prerequisites or human priority |
| [WED-089](WED-089-build-the-guest-list-with-rsvp-status-and-filter.md) | L | Revised acceptance, scope, prerequisites or human priority |
| [WED-090](WED-090-add-and-edit-invitations-and-guests-one-by-one.md) | M | Revised acceptance, scope, prerequisites or human priority |
| [WED-091](WED-091-import-guests-from-csv-with-a-validation-preview.md) | M | Revised acceptance, scope, prerequisites or human priority |
| [WED-092](WED-092-export-the-guest-list-to-csv.md) | S | Revised acceptance, scope, prerequisites or human priority |
| [WED-093](WED-093-build-the-seating-plan-tables-and-assignments.md) | L | Retained after review; generated inverse links may change |
| [WED-094](WED-094-print-table-cards-with-the-shared-order-qr-and-w.md) | M | Revised acceptance, scope, prerequisites or human priority |
| [WED-095](WED-095-build-the-menu-editor-with-a-live-sold-out-toggl.md) | M | Revised acceptance, scope, prerequisites or human priority |
| [WED-096](WED-096-manage-staff-pins-and-expiry.md) | M | Revised acceptance, scope, prerequisites or human priority |
| [WED-097](WED-097-show-live-counters-on-the-admin-dashboard.md) | M | Retained after review; generated inverse links may change |
| [WED-098](WED-098-build-the-admin-theme-editor-with-preview-and-ac.md) | M | Revised acceptance, scope, prerequisites or human priority |
| [WED-099](WED-099-add-the-iv-design-editor-for-photo-and-text.md) | M | Revised acceptance, scope, prerequisites or human priority |
| [WED-100](WED-100-show-each-invitation-s-rsvp-change-history.md) | S | Retained after review; generated inverse links may change |
| [WED-101](WED-101-build-the-event-settings-page.md) | M | Revised acceptance, scope, prerequisites or human priority |
| [WED-102](WED-102-choose-the-service-worker-approach-for-next-js-1.md) | S | Revised acceptance, scope, prerequisites or human priority |
| [WED-103](WED-103-generate-the-web-app-manifest-from-the-active-th.md) | M | Revised acceptance, scope, prerequisites or human priority |
| [WED-104](WED-104-generate-maskable-icons-apple-touch-icons-and-sp.md) | M | Retained after review; generated inverse links may change |
| [WED-105](WED-105-add-the-service-worker-with-per-route-caching.md) | L | Revised acceptance, scope, prerequisites or human priority |
| [WED-106](WED-106-add-an-offline-fallback-page.md) | S | Retained after review; generated inverse links may change |
| [WED-107](WED-107-keep-the-guest-s-own-qr-pass-available-offline-o.md) | M | Revised acceptance, scope, prerequisites or human priority |
| [WED-108](WED-108-make-the-scanner-app-shell-work-fully-offline.md) | M | Revised acceptance, scope, prerequisites or human priority |
| [WED-109](WED-109-prompt-installation-on-android-and-chrome.md) | M | Retained after review; generated inverse links may change |
| [WED-110](WED-110-add-an-ios-add-to-home-screen-guide.md) | S | Retained after review; generated inverse links may change |
| [WED-111](WED-111-show-an-update-available-prompt-for-new-versions.md) | M | Revised acceptance, scope, prerequisites or human priority |
| [WED-112](WED-112-send-web-push-to-staff-boards-where-supported.md) | L | Retained after review; generated inverse links may change |
| [WED-113](WED-113-automate-installability-and-offline-checks-in-pl.md) | M | Revised acceptance, scope, prerequisites or human priority |
| [WED-114](WED-114-test-installation-on-real-android-and-ios-device.md) | S | Revised acceptance, scope, prerequisites or human priority |
| [WED-115](WED-115-add-automated-accessibility-checks-to-playwright.md) | M | Revised acceptance, scope, prerequisites or human priority |
| [WED-116](WED-116-gate-guest-pages-on-lighthouse-mobile-scores-of.md) | M | Revised acceptance, scope, prerequisites or human priority |
| [WED-117](WED-117-audit-guest-journeys-for-wcag-2-2-aa-and-fix-fin.md) | L | Revised acceptance, scope, prerequisites or human priority |
| [WED-118](WED-118-audit-staff-and-admin-screens-for-accessibility.md) | L | Revised acceptance, scope, prerequisites or human priority |
| [WED-119](WED-119-optimise-every-image-for-avif-webp-sizes-and-blu.md) | M | Revised acceptance, scope, prerequisites or human priority |
| [WED-120](WED-120-set-metadata-and-keep-private-pages-out-of-searc.md) | S | Revised acceptance, scope, prerequisites or human priority |
| [WED-121](WED-121-fail-e2e-on-layout-shift-or-console-errors-on-gu.md) | M | Retained after review; generated inverse links may change |
| [WED-122](WED-122-agree-data-retention-and-privacy-notice-details.md) | S | Revised acceptance, scope, prerequisites or human priority |
| [WED-123](WED-123-rate-limit-iv-lookups-order-creation-and-pin-att.md) | M | Revised acceptance, scope, prerequisites or human priority |
| [WED-124](WED-124-review-security-headers-and-csp-for-camera-worke.md) | S | Revised acceptance, scope, prerequisites or human priority |
| [WED-125](WED-125-document-and-enforce-secrets-handling-and-key-ro.md) | M | Revised acceptance, scope, prerequisites or human priority |
| [WED-126](WED-126-publish-the-uk-gdpr-privacy-notice-on-the-rsvp-p.md) | M | Revised acceptance, scope, prerequisites or human priority |
| [WED-127](WED-127-add-the-data-retention-job-that-deletes-guest-da.md) | M | Revised acceptance, scope, prerequisites or human priority |
| [WED-128](WED-128-restrict-dietary-notes-to-admin-and-kitchen.md) | S | Revised acceptance, scope, prerequisites or human priority |
| [WED-129](WED-129-run-a-security-review-of-tokens-access-control-a.md) | M | Revised acceptance, scope, prerequisites or human priority |
| [WED-130](WED-130-enforce-coverage-on-critical-logic.md) | M | Retained after review; generated inverse links may change |
| [WED-131](WED-131-cover-the-invitation-rsvp-and-pass-journey-end-t.md) | M | Revised acceptance, scope, prerequisites or human priority |
| [WED-132](WED-132-cover-gate-scanning-partial-admission-and-search.md) | M | Retained after review; generated inverse links may change |
| [WED-133](WED-133-cover-table-ordering-to-the-boards-end-to-end.md) | M | Revised acceptance, scope, prerequisites or human priority |
| [WED-134](WED-134-cover-admin-guest-import-seating-menu-and-staff.md) | M | Revised acceptance, scope, prerequisites or human priority |
| [WED-135](WED-135-add-visual-regression-across-themes-and-prd-devi.md) | M | Retained after review; generated inverse links may change |
| [WED-136](WED-136-test-the-gate-end-to-end-with-the-network-switch.md) | M | Revised acceptance, scope, prerequisites or human priority |
| [WED-137](WED-137-load-test-350-guests-at-the-gate-and-30-tables-o.md) | L | Revised acceptance, scope, prerequisites or human priority |
| [WED-138](WED-138-test-the-guest-flow-in-whatsapp-s-browser-on-ios.md) | S | Revised acceptance, scope, prerequisites or human priority |
| [WED-139](WED-139-create-the-sentry-project-and-share-its-dsn.md) | S | Revised acceptance, scope, prerequisites or human priority |
| [WED-140](WED-140-add-sentry-error-tracking-to-server-and-client.md) | M | Revised acceptance, scope, prerequisites or human priority |
| [WED-141](WED-141-add-request-ids-and-structured-logs-to-server-ac.md) | S | Retained after review; generated inverse links may change |
| [WED-142](WED-142-set-up-uptime-checks-for-guest-scanner-and-board.md) | S | Revised acceptance, scope, prerequisites or human priority |
| [WED-143](WED-143-build-the-admin-health-page.md) | M | Retained after review; generated inverse links may change |
| [WED-144](WED-144-create-the-production-supabase-project.md) | S | Revised acceptance, scope, prerequisites or human priority |
| [WED-145](WED-145-create-the-vercel-project-and-connect-the-reposi.md) | S | Revised acceptance, scope, prerequisites or human priority |
| [WED-146](WED-146-buy-the-domain-and-point-it-at-vercel-with-https.md) | S | Revised acceptance, scope, prerequisites or human priority |
| [WED-147](WED-147-configure-vercel-builds-and-preview-deployments.md) | M | Revised acceptance, scope, prerequisites or human priority |
| [WED-148](WED-148-define-and-validate-environment-variables-per-en.md) | M | Revised acceptance, scope, prerequisites or human priority |
| [WED-149](WED-149-decide-and-set-up-the-database-for-previews-and.md) | M | Revised acceptance, scope, prerequisites or human priority |
| [WED-150](WED-150-run-migrations-safely-in-the-deploy-pipeline.md) | M | Revised acceptance, scope, prerequisites or human priority |
| [WED-151](WED-151-set-up-database-backups-and-prove-a-restore.md) | M | Revised acceptance, scope, prerequisites or human priority |
| [WED-152](WED-152-run-smoke-tests-against-every-deployment.md) | M | Revised acceptance, scope, prerequisites or human priority |
| [WED-153](WED-153-write-and-rehearse-the-rollback-plan.md) | S | Revised acceptance, scope, prerequisites or human priority |
| [WED-154](WED-154-release-to-production-and-confirm-the-site-insta.md) | M | Revised acceptance, scope, prerequisites or human priority |
| [WED-155](WED-155-visit-the-venue-and-measure-signal-at-the-gate-a.md) | S | Retained after review; generated inverse links may change |
| [WED-156](WED-156-buy-the-4g-router-backup-sim-power-banks-and-bac.md) | S | Retained after review; generated inverse links may change |
| [WED-157](WED-157-load-the-real-guest-list-and-menu.md) | M | Revised acceptance, scope, prerequisites or human priority |
| [WED-158](WED-158-proof-read-every-guest-facing-message-and-screen.md) | S | Revised acceptance, scope, prerequisites or human priority |
| [WED-159](WED-159-share-the-invitations-with-every-guest.md) | M | Revised acceptance, scope, prerequisites or human priority |
| [WED-160](WED-160-print-the-table-cards.md) | S | Revised acceptance, scope, prerequisites or human priority |
| [WED-161](WED-161-write-the-day-of-runbook-with-fallbacks.md) | M | Revised acceptance, scope, prerequisites or human priority |
| [WED-162](WED-162-train-ushers-and-caterers-on-their-screens.md) | S | Retained after review; generated inverse links may change |
| [WED-163](WED-163-rehearse-at-the-venue-with-real-devices-and-the.md) | M | Retained after review; generated inverse links may change |
| [WED-164](WED-164-freeze-the-code-and-make-the-go-no-go-decision.md) | S | Revised acceptance, scope, prerequisites or human priority |
| [WED-165](WED-165-export-and-print-the-gate-guest-list-on-the-morn.md) | S | Retained after review; generated inverse links may change |
| [WED-166](WED-166-close-the-event-expire-pins-close-ordering-expor.md) | M | Revised acceptance, scope, prerequisites or human priority |
| [WED-167](WED-167-hand-the-couple-their-memories-export.md) | S | Retained after review; generated inverse links may change |
| [WED-168](WED-168-confirm-guest-personal-data-is-deleted-after-ret.md) | S | Revised acceptance, scope, prerequisites or human priority |
| [WED-169](WED-169-approve-offline-freshness-and-the-gate-credentia.md) | S | Added; explicit scope, negative cases and verification |
| [WED-170](WED-170-add-qr-paper-and-accessible-decorative-accent-to.md) | M | Added; explicit scope, negative cases and verification |
| [WED-171](WED-171-migrate-menu-and-station-order-tables-independen.md) | M | Added; explicit scope, negative cases and verification |
| [WED-172](WED-172-migrate-staff-identities-and-device-registration.md) | M | Added; explicit scope, negative cases and verification |
| [WED-173](WED-173-reconcile-offline-admissions-atomically-on-the-s.md) | L | Added; explicit scope, negative cases and verification |
| [WED-174](WED-174-add-the-admin-scan-log-and-dispute-filters.md) | M | Added; explicit scope, negative cases and verification |
| [WED-175](WED-175-validate-and-store-invitation-photo-uploads.md) | M | Added; explicit scope, negative cases and verification |
| [WED-176](WED-176-release-invitations-before-the-wedding-day-featu.md) | M | Added; explicit scope, negative cases and verification |
| [WED-177](WED-177-import-and-reconcile-the-real-invitation-guest-l.md) | S | Added; explicit scope, negative cases and verification |
| [WED-178](WED-178-offer-an-optional-guest-portrait-for-gate-identi.md) | M | Added; explicit scope, negative cases and verification |
| [WED-179](WED-179-rehearse-database-and-asset-recovery-in-an-isola.md) | L | Added; explicit scope, negative cases and verification |
| [WED-180](WED-180-preserve-queued-events-across-worker-and-data-up.md) | M | Added; explicit scope, negative cases and verification |
| [WED-181](WED-181-persist-validated-theme-drafts-and-activate-them.md) | M | Added; explicit scope, negative cases and verification |
| [WED-182](WED-182-validate-and-commit-guest-csv-imports-atomically.md) | M | Added; explicit scope, negative cases and verification |
| [WED-183](WED-183-resolve-signed-pass-urls-without-exposing-invita.md) | M | Added; explicit scope, negative cases and verification |
| [WED-184](WED-184-expire-private-offline-data-and-recover-from-sto.md) | M | Added; explicit scope, negative cases and verification |
| [WED-185](WED-185-protect-invitation-and-pin-endpoints-before-invi.md) | M | Added; explicit scope, negative cases and verification |

## Ten highest-risk tickets

| Rank | Ticket | Why |
| --- | --- | --- |
| 1 | WED-169 — Offline trust contract | Immediate revocation and disconnected operation conflict; URL authority, freshness and expiry must be approved before signing. |
| 2 | WED-173 — Atomic offline reconciliation | Concurrent devices can physically over-admit. Preserve evidence while bounding canonical counts and making retry idempotent. |
| 3 | WED-180 — Worker/database upgrades | An update or rollback can erase the only unsynced admission records; exercise actual old/new worker versions. |
| 4 | WED-185 — Public endpoint protection | Invitation enumeration and PIN brute force precede the full app; distributed limits must hold across instances. |
| 5 | WED-027 — Role and Realtime isolation | One broad policy or nested projection can disclose contact/dietary data to gate/bar or anonymous users. |
| 6 | WED-056 — Signed pass contract and keys | Forgery, key leakage or stale party-size claims undermine every gate decision; use approved contract and rotation tests. |
| 7 | WED-072 — Order commit and retry | Duplicate taps/reconnects race sold-out/cap updates and can duplicate kitchen work unless atomic and idempotent. |
| 8 | WED-085 — WhatsApp delivery | Provider account approval, opt-in, batching and uncertain delivery retries are external launch risks; board must remain usable. |
| 9 | WED-179 — Database and media recovery | A backup is not proven until rows, files, access configuration and references restore together within approved RPO/RTO. |
| 10 | WED-176 — Early invitation release | Must send before the full application exists while protecting guest data, disabling unfinished surfaces and proving recovery. |

## Ordering and validation evidence

- `findCycle` returned null. Repeated calls to the production `ready` selector with `includeHuman: true`, changing statuses only in an in-memory copy, reached all 182 todo tickets with zero stranded todo tickets. The three optional backlog tickets (WED-022, WED-082, WED-178) are intentionally excluded.
- First ten simulated picks: WED-001, WED-002, WED-003, WED-009, WED-034, WED-010, WED-023, WED-017, WED-025, WED-029. Actual live CLI picks: WED-001 for `pnpm t:next`, WED-034 for `pnpm t:next --human`.
- Invitation-release prerequisites are prioritized ahead of full wedding-day work: WED-176 is simulated pick 89, WED-159 first-send is 92, and WED-154 full release is 165. These are sequential topological positions, not hours or dates. The earlier priority mix delayed sending even without dependency blockers; it was corrected.
- The early release has no dependency on completed scanner UI, offline merge or ordering features. It does require shared schemas, roles, signed QR, guest security and recovery foundations.
- Existing status/owner/agent/start/completion/reason fields were compared against all 168 base tickets and are unchanged. New statuses were set only by `pnpm t:new`. No ticket is marked implemented by this audit.

The generated roadmap assumes people complete their tasks in parallel; it is not a calendar commitment. `t:next` without `--human` deliberately excludes human work. Run both queues: account setup and decisions must be actively owned. A source inspection also found that the forecast treats cancelled prerequisites as satisfied while the actual ready picker requires done. There are no cancelled tickets in this backlog, so this does not affect the audited order; future cancellation must rewire dependent tickets explicitly.

## Verification and review boundaries

- `pnpm t:validate`: 185 tickets valid; generated boards current.
- `pnpm t:render`: successful; repeated render produces no changes.
- `pnpm exec vitest run scripts/__tests__/tickets.test.ts`: 19 tests passed, including the AUDIT.md allowlist regression.
- `pnpm verify`: passed with public local defaults from `.env.example` supplied as process environment, `PW_PORT=3198`, `CI=1`: format, lint, types, 69 unit tests, production build, 17 smoke passes and 7 existing skips.
- The first verification attempt reached the smoke server but lacked DATABASE_URL; a second smoke-only attempt also exposed missing public build-time values. Neither was counted as a pass. The complete gate was then rerun with all documented public defaults and passed. No secret files were read or changed, and no production/database mutation was performed.
- After the final priority-only ticket edits, render/validate and formatting were rerun. No product UI changed; new visual or physical-device checks would not test this documentation change. Future feature acceptance remains unverified.
- `git diff --check` passes. Upstream rewrote commit history during the audit; `07b6a46` and current ticket-system base `ed10960` have identical tree `62a8aad2e655820515a90519940e144480145b16`. The audit commit is transplanted onto the current base and the PR targets `chore/ticket-system`, whose prior PR #1 was closed, rather than pulling the entire unmerged harness into a main-targeted audit PR.

No product features, migrations, dependencies or CI settings changed. The only executable change permits the specifically requested `tickets/AUDIT.md` in the validator; a regression test proves unexpected Markdown still fails. Generated BOARD/ROADMAP and inverse dependency fields were rendered by the CLI. Existing attribution in historical activity logs was preserved; no attribution was added to new work or commit messages.

External check: [Chrome documents that Lighthouse PWA testing is deprecated](https://developer.chrome.com/docs/lighthouse/pwa/pwa-each-page-has-url/); [Lighthouse removal tracking](https://github.com/GoogleChrome/lighthouse/issues/15535). Keep Lighthouse performance/accessibility targets, but use manifest, worker, HTTPS and real-device install evidence for PWA readiness.
