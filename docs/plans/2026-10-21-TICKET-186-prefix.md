# TICKET-186 — Ticket prefix migration

Rename canonical IDs and filenames from WED to TICKET, update references and shared instructions, and regenerate boards. Preserve active legacy branches and shared ledger storage keys so concurrent old/new clients cannot double-claim a ticket. The numeric suffix remains unchanged. Verify formatting, numeric ordering, legacy lookups, claim overlay, branch compatibility and two-clone races, then run the full gate. No product code changes.
