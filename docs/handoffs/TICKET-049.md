# TICKET-049 — 2026-10-27

Owner divine; agent codex; branch TICKET-049; base dc31f20756eddff4b9744c3fbbd7c99a4a798fa9. Managed app port 28430 and browser port 28431.

## Changes

Pure `normalisePhone(unknown)` returns a typed success/error union. UK local and bare-44 formats normalize to +44; explicit +/00 international numbers retain significant zeroes. Presentation punctuation is validated, not blindly discarded. Extensions, malformed parentheses, misplaced plus signs, numeric runtime values, overlong and implausibly short contacts fail without throwing. No dependency, database or UI changes.

This is structural normalization, not a global numbering-plan allocation validator or WhatsApp/ownership check. International contact policy is 7–15 digits; UK national parts are 10 digits (or nine for geographic numbers beginning 1). Callers must use the success branch before constructing links. Sharing UI integration remains TICKET-050.

## Evidence

Regression suite initially failed because the phone module was absent. After implementation: 51 table-driven cases pass, including all ticket examples, international preservation, invalid runtime types and idempotence. `pnpm verify:quick` passes lint/types/51 related tests. Full `pnpm verify` passed: ticket validation, formatting, lint, types, 342 unit passes (10 opt-in DB skips), production build and 172 browser passes (28 conditional skips), with no retries. Evidence log: `.harness/t049-verify.log`.

## Next action

Commit completed evidence and open PR with `AGENT_OWNER=divine pnpm t:pr TICKET-049`. Do not mark done before a verified merge.
