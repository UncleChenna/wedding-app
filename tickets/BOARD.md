# Ticket board

Run `pnpm t:dashboard` and open http://127.0.0.1:4173. VS Code can start it automatically after you approve the optional folder-open task.

- Search, filter, and open ticket details in status columns.
- Local ticket files are watched; shared-ledger status refreshes every 20 seconds. Connection and last-success time are visible.
- Filters and open details survive refresh. Export an offline file with `pnpm t:dashboard:snapshot`.
- Terminal view: `pnpm t:board`. Next ready task: `pnpm t:next`.
- Markdown snapshot: `pnpm t:render` → `artifacts/tickets/BOARD.md`.

This file is a stable entry point. Do not replace it with generated ticket rows.
Generated views stay in ignored `artifacts/tickets/` and never enter feature PRs.

[Workflow rules](../docs/tickets.md) · [Roadmap](ROADMAP.md)
