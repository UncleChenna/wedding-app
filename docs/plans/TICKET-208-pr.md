# Ticket

Ticket: TICKET-208

# Summary

Managed worktree startup needs the auth templates referenced by its generated Supabase configuration. The existing recursive copy had no regression coverage and could follow unsafe template paths. Setup now checks the complete template tree before copying, preserves template bytes and refreshes existing templates without deleting unrelated files.

# Changes

- Replace the unguarded recursive copy with a shared helper called before database startup.
- Bound setup paths to the checkout and reject source/destination symlinks, including dangling links and linked parent folders.
- Copy regular files and nested directories only after preflight validation.
- Add nine filesystem regression cases and record setup evidence.

# Acceptance criteria and evidence

- Managed TICKET-208 setup started its own Supabase project and applied migrations using the updated script.
- Source and isolated admin-code.html compare byte-for-byte with cmp.
- Tests cover repeat refresh, unrelated-file preservation, optional absent templates, nested folders, symlinks and checkout escapes.
- Full pnpm verify passed: 498 unit tests (26 skipped), 525 browser tests (135 skipped), build, formatting, lint and types.

# Verification

Focused regression suite: 9 passed. Quick verification: lint, types and related tests passed. Full log: artifacts/TICKET-208/full-verification.log.
Verified base: fd91e877e29b32ef911acfd45036ad65767732c7.
Integration: AGENT_OWNER=divine node .worktrees/TICKET-208/scripts/worktree.mjs new TICKET-208 from the coordination checkout; isolated project wedding-5f5a19e784db started successfully.

# Risks and rollout

No migration, credentials, auth policy, email wording or UI changes. Existing template symlinks now cause an explicit setup error; replace them with regular committed files. This is a setup-time guard, not protection against another process concurrently replacing files after validation. Rollback by reverting this ticket; no database reset is required.

# Screenshots

N/A: no UI changes.

# UI checklist

N/A for visual, copy, device, motion, QR and staff checks: only worktree setup and filesystem tests change. Full verification remains required.

# Harness changes, if any

One helper replaces the existing copy call. No hooks, checks or CI rules were weakened. Current-base inspection corrected the earlier diagnosis: TICKET-029 already included a basic copy; this ticket adds safety and tests.
