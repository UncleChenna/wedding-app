# Ticket

TICKET-189

# Summary

Add a separate visual ticket dashboard and remove the repeated shared-file writes behind the recent PR conflicts. `pnpm t:dashboard` creates a self-contained HTML snapshot; feature branches no longer regenerate tracked boards or prepend to a shared handoff log.

# Changes

- Seven status columns, search, epic/owner/priority/label filters, counts, epic progress, theme switching and keyboard-accessible details with acceptance criteria, dependencies and safe PR links.
- Reuse effective ledger state with snapshot time/base and explicit offline fallback. No server, new dependency, public route or external page request.
- Move generated Markdown/HTML into ignored artifacts; retain stable tracked board/roadmap entry points. Reverse dependencies are views, not cross-ticket file mutations.
- Scope sync/status pushes to the assigned ticket, reject unrelated staged files, and remove automatic unrelated completion sync. Live claim/move dependency checks remain authoritative; stale committed prerequisite statuses no longer block static validation.
- New managed worktrees start from freshly fetched develop; only a missing ticket definition is carried over. Existing branches retain their history.
- Shared and Claude-facing instructions use per-ticket handoffs. ADR 0015 describes the one-time rollout for existing branches.

# Acceptance criteria and evidence

Dashboard functionality and accessibility are exercised by `e2e/ticket-dashboard.spec.ts`. Ticket CLI regressions cover unchanged tracked files after rendering, ledger overlay and offline fallback, script-safe ticket text, rejection of cross-ticket syncing, and fresh worktree bases. Existing atomic claim/transition tests still pass. Historical progress was not rewritten.

# Verification

Initial regression proved tracked-board rewrites. Quick gate passed. Full `pnpm verify` passed with public local environment defaults: 189 tickets valid, formatting, lint, types, 112 unit tests, production build, 21 smoke passes and 7 existing skips. Six theme/width screenshots plus real overview/details inspected. Chromium local-file navigation passed. Safari/Firefox and real handset keyboards are not verified; no guest flow changed.

# Risks and rollout

This is a read-only snapshot: regenerate and reload to refresh. The selected checkout must contain a ticket definition to display it. Ledger status can still lag GitHub until the existing CLI completion step is run. Generated files contain internal project text and should not be publicly hosted.

After merging, update existing branches once, retain stable board entry points, and move new handoffs into their own ticket files. Both developers and all agents must use the updated CLI; old versions can still rewrite shared boards. This removes recurring tracking conflicts, not conflicts in genuinely shared code. No ledger-format or database migration. Reverting the implementation restores the old workflow; preserve per-ticket handoff history.

# Screenshots and UI checklist

Full checklist and eight screenshots: [UI review](https://github.com/UncleChenna/wedding-app/blob/TICKET-189/docs/reviews/TICKET-189/README.md). Two existing colour themes, three widths; no product UI or palettes changed. Standalone HTML intentionally uses native controls and system font fallbacks instead of importing React/Next runtime assets.
