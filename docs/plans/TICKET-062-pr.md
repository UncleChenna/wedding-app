# Ticket

TICKET-062 — Log every scan with time, device, staff and result.

# Summary

Online pass checks previously left no dispute evidence unless someone was admitted. Each authenticated check now records its result, observed/server time and real signed-in staff/device, while a valid check still admits zero people. A subsequent explicit admission retains the existing atomic count and exact-request retry behavior.

# Changes

- Add nullable `input_method` (`qr` or `manual`) through generated migration0027. Historical provenance remains unknown; existing online/offline/legacy transport and replay bindings stay unchanged.
- Write zero-person immutable scan observations after actual local signature verification and authorized invitation lookup. The five result values are preserved; replaced maps to revoked and unknown signed identities map to invalid with no invitation FK. Technical failures remain unavailable rather than a guest verdict.
- Derive actor/device exclusively from live signed sessions, lock credential/device rows and reauthorize after waits and after persistence before returning private details.
- Enforce same-origin writes and bounded browser timestamps. Oversized decoded QR content becomes a bounded invalid marker before transmission. Logs never contain raw QR/PIN, dietary notes, names or email.
- Provide the server-only manual-input persistence contract for TICKET-063; clients cannot submit manual/source/count/actor fields. TICKET-066 owns offline queueing and TICKET-174 owns admin filtering.
- Add the opt-in observation database suite to existing CI before the ordering fixture, preserving every existing check.

# Acceptance criteria and evidence

- **Five results, including unknown tokens:** actual production camera and authenticated HTTP paths persist all five canonical verdicts, replaced status and a verified-but-unknown invitation. Unknown evidence has a null invitation FK. Tests retain exact admission-count assertions and verify zero-person observations separately.
- **Manual input provenance:** real SQL records `input_method=manual` with the unchanged result vocabulary and `source=online`. The public QR endpoint rejects forged manual/source/actor fields. Manual lookup UI remains its existing dependent TICKET-063.
- **Private identity and denied reads:** actual browser enrollment determines logged device; SQL verifies staff/device, authoritative receipt time, no sensitive fields, unchanged append-only guards and empty reads for both nonprivileged browser roles. No RLS policy was changed.

# Verification

Base `ad730efa` (verified TICKET-224 harness update), integrated as `028730fa`; no product conflicts. Independent source review found no blocker; final source/SQL/CI review is clean after documenting the test-only flag; exact-head CI remains required.

- Red pure tests failed before implementation. Mapping/HTTP boundary and adapter tests **24/24 pass**; scanner regression **9/9 pass**, including bounded oversized output.
- Quick lint, strict types and related tests pass. Final integrated quick passes lint/types.
- Isolated PostgreSQL16: **9/9 pass** across four new observation cases and five existing admission cases. Covers all verdicts/manual metadata, denied reads despite SELECT privilege, unchanged counter/replay, revoked credentials and an actual staff-row lock followed by session expiry and zero writes.
- Generated migration applied twice; all table and migration counts are identical on repeat. Every public table retains RLS. Initial database public-table count was zero. The synthetic database is now stopped with its directory retained; no collaborator data or production database was touched.
- Production standalone scanner generation and application build pass.
- Actual production admission/logging journey **2/2 pass,33.4s**, mobile and desktop; all-five HTTP results, unknown signed identity, enrolled device, partial count and committed-response-loss replay.
- Existing production camera/result/seating journey **2/2 pass,35.8s**; initial/reassigned/unassigned seating, all six rendered states and exact nine zero-person observations while only one explicit admission remains.
- Earlier test-only mismatches were corrected: the browser enrolls its own device instead of using the separate seeded device; the seating journey performs three valid scans, not two. Assertions now match those actual operations and preserve all original protections.
- Full serial unit/coverage: **1825 passed,195 conditional skips,134.89s**; critical coverage **98.33% lines /98.56% branches**, unchanged per-file95% gate. Focused CI environment/parity tests **15/15 pass** after documenting the new flag. Exact final-head hosted CI is required before merge.

# Risks and rollout

Deploy generated0027 before application code. It only adds a nullable constrained column; no existing rows or policies change. Rolling back the application can leave the unused column; preserve immutable audit evidence rather than deleting logs. Observation storage failure now fails closed as unavailable. Browser time is untrusted and limited to the preceding24hours or next5minutes; server receipt time is authoritative.

No production migration application, physical-phone certification or Realtime/Auth-service validation is claimed. TICKET-201 retains physical release gates. Offline reads are not falsely described as recorded online observations. The previously disclosed synthetic camera decode flake is not claimed fixed by this logging work.

# Screenshots

No visual markup/style change; the browser change only adds bounded request metadata. Regression screenshots are in `docs/reviews/TICKET-062/{mobile,desktop,read-results-mobile,read-results-desktop}/` (288 images). All four themes and375/768/1280 widths were captured. Inspected the375px ivory valid and not-RSVP images: readable, no clipping or overlap.

# UI checklist

| Check                           | Result                                                                                                              |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Screenshots                     | Staff375px ivory reviewed; full regression matrix retained at paths above.                                          |
| Tokens, typography, restraint   | Unchanged rendered components; no added colours, spacing, fonts or effects.                                         |
| Mobile, keyboard, contrast      | Existing browser assertions pass: bounds,44px controls, keyboard focus and all-theme axe0.                          |
| Motion                          | Existing reduced-motion admission journey passes; no animation change.                                              |
| Load/images/performance         | No rendered/image/font change; no new performance claim. Staff-only screen, guest Lighthouse target not applicable. |
| Copy/shared components/feedback | Unchanged approved result copy and shared components; no new success or admission semantics.                        |
| Sharing/devices/QR output       | No guest-sharing or QR-output change; physical release checks remain TICKET-201.                                    |
| Verification                    | Scoped production browser/SQL/quick pass; full unit/coverage pass; final CI pending.                                |

# Harness changes, if any

Only an additive SQL test command/flag in existing CI. No thresholds, retries, guards, hooks or assertions weakened. Synthetic test roles receive SELECT in the guarded disposable database solely to prove RLS denies reads rather than relying on missing privileges.

Independent review caught the missing test-only `.env.example` declaration; fixed and verified. Definition-only TICKET-226 tracks explicitly running parity on workflow/environment changes during quick verification. No unrelated harness implementation is included.
