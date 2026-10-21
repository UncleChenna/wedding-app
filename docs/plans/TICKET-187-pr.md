# Ticket

Ticket: TICKET-187

# Summary

Require every agent to review the live task list and roadmap before coding, read the intended ticket and its dependencies/PRD/handoff, confirm scope and ownership, and state the intended outcome and verification. Recheck after scope changes and before declaring completion. The rule lives in AGENTS.md with links from ticket-workflow and implement-task; Claude already imports AGENTS.md.

# Validation

Formatting, shared-instruction links and 187-ticket validation pass. Full pnpm verify passes with public local defaults: 73 unit tests, production build, 17 smoke passes and 7 existing skips.

# Screenshots and UI checklist

Not applicable: documentation-only instructions; no product UI changes.

# Harness changes

Updates canonical agent instructions and workflow skills only. Stacked on the ticket-prefix migration branch so the current TICKET naming remains consistent.
