# Ticket board

Open the visual dashboard with `pnpm t:dashboard`, then open the printed HTML path in your browser.

- Search, filter, and open ticket details in status columns.
- Status comes from the shared ledger when available; snapshots show their timestamp and offline fallback.
- Run the command again and reload the page to refresh.
- Terminal view: `pnpm t:board`. Next ready task: `pnpm t:next`.
- Markdown snapshot: `pnpm t:render` → `artifacts/tickets/BOARD.md`.

This file is a stable entry point. Do not replace it with generated ticket rows.
Generated views stay in ignored `artifacts/tickets/` and never enter feature PRs.

[Workflow rules](../docs/tickets.md) · [Roadmap](ROADMAP.md)
