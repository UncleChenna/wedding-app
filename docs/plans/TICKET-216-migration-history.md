# Local migration history inventory

5 November 2026. These are local synthetic development targets, not hosted verification.

| Target                                     | Source commit                            | Applied journal rows | Result                                                                                     |
| ------------------------------------------ | ---------------------------------------- | -------------------- | ------------------------------------------------------------------------------------------ |
| New TICKET-216 / wedding-08f6ded40082      | c9c9e66010ee773189477139d4f8b0d30cf481e1 | 13                   | Every SQL SHA-256 and journal timestamp matches develop in order.                          |
| Existing TICKET-211 / wedding-f6358e81c232 | 7ea316ba4bddcfcb418e7c180c2fae03af81e618 | 9                    | Every SQL SHA-256 and journal timestamp matches the original branch in order; no mutation. |

The chains share exactly migrations 0000-0005. Develop then has ordering/staff/request-budget migrations 0006-0012; the experimental branch instead has member RSVP migrations 0006-0008. They cannot be concatenated or replayed onto each other blindly.

Preserve the published develop SQL/order and the original experimental branch/database. Generate an append-only integration candidate from the develop snapshot, retaining the experimental SQL bytes and provenance as historical evidence. Review handling of each old applied branch before authorizing any execution; this inventory is not migration approval.

Hosted applied history and any actual legacy target remain unknown. Obtain an environment-identified, read-only journal export (id, hash, created_at) without credentials before a hosted plan. The destructive bridge remains separately blocked.

Raw hashes/timestamps and comparisons are in ignored artifacts/TICKET-216/migration-history-proof.json.
