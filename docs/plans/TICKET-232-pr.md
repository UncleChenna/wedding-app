# Ticket

Ticket: TICKET-232

# Summary

Merged kitchen, bar and order-status work still appears unfinished because the physical tablet check has no recorded result and two original PRs had failed CI. Retain that manual check as an explicit release gate and record the exact recovery sequence, without changing product code or claiming device tests passed.

# Changes

- Replace TICKET-076’s unchecked physical criterion with an explicitly completed transfer of that requirement to TICKET-201. The wording certifies the transfer only.
- Add an unchecked one-metre kitchen/bar tablet check to TICKET-201, including actual event hardware, themes, lighting, typography, controls and feedback. TICKET-201 continues to block both TICKET-154 and TICKET-176.
- Keep all historical failures and original PR links; use coordinated ownership handoff and existing CLI gates after this definition repair merges. No collaborator checkout is modified.

# Acceptance criteria and evidence

- PASS: physical tablet legibility remains unperformed and explicitly unchecked in TICKET-201; both release dependencies are unchanged.
- PASS: exact evidence and dependency order below distinguish original successful CI from repairs. No direct completion will substitute for a failed original run.
- PASS: ticket validation and targeted Markdown formatting pass.

# Audited completion sequence

| Order | Ticket / original PR | Evidence and required action                                                                                                                                                                                                                                                                                           |
| ----- | -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | TICKET-076 / #140    | Merged `9da4b071`; tested head `b22a3d4f395cd779aec59b8a467d972eca30c99b`; all seven CI jobs passed run42733963211. After this requirement transfer merges, coordinated ledger handoff then normal CLI completion, which discovers the original merged PR from the ticket branch.                                      |
| 2     | TICKET-077 / #155    | Merged `3b6c04e7`; tested head `6fcdf4696b02c3a5c645767ffc404df11cc0a61a`; all seven jobs passed run42888593055. Complete only after076.                                                                                                                                                                               |
| 3     | TICKET-078 / #156    | Original head `b772fff96e482514c297bb9f751107740cb1ac4d`, run43088907304: camera failed and general verification cancelled. Preserve this history, mark blocked with the cause through CLI, then reconcile against verified repair#164 after076.                                                                       |
| 4     | TICKET-075 / #159    | Original head `df06b098bd71cfc19d9ba1fa148b1922fdca5b52`, run43110368023: general verification failed on the missing Scan log navigation expectation, and admission camera decoding failed inside the invitation journey. Preserve this history, mark blocked through CLI, then reconcile against repair#164 after078. |
| 5     | TICKET-133 / #166    | Merged `ddc81755`; tested head `30c5d3e64bf5efe1b43dcf58d3b3d702adf216ad`; successful run43201619402. Complete only after075/077/078 and its other existing blockers.                                                                                                                                                  |

Repair#158 fixed dense signed QR decoding: tested head `f4ba16c79a3ffa1726aa0708e0881b19d77fa291`, successful run43197305231, merged `2a0cf958`. Later integrated repair#164 (TICKET-066) contains the original ordering merges, camera/online-admission fixes and the corrected Scan log navigation expectation. Its exact tested head is `dd7722157992517f6ecb5fb157083de09ab42a2f`, merged `1cc4f020`; run43247685207 passed all ten jobs including full verification proof. The CLI must independently prove original-merge ancestry, exact repair head, current complete criteria, completed dependencies and successful CI before recording either recovery.

The owner has authorized completion of merged work and separate manual release QA. Ownership changes use `t:handoff --from unclechenna --agent codex --coordinated` with an explicit ledger-only reconciliation reason; no identity impersonation or worktree takeover is needed. Lifecycle updates occur in the shared ledger after merge, leaving historical files and activity intact.

# Verification

- GitHub read-only checks confirmed original merged heads and CI results above; repair-head ancestry for both078 and075 was verified locally.
- `pnpm t:validate`: passes.
- Targeted `prettier --check`: passes.
- No new product tests or physical-device measurements: documentation-only change. Existing CI gates remain mandatory for this PR. A failed reconciliation command will leave the corresponding ticket open and be reported honestly.

# Risks and rollout

This allows preview implementation closure, not guest release. Physical tablet results remain mandatory in TICKET-201. Reverting this PR restores the old definition disposition but does not undo ledger history; any correction must use the CLI. No migrations, runtime changes, dependencies, services or infrastructure changes.

# Screenshots and UI checklist

N/A: no UI or styling changed. Existing screenshot and runtime verification evidence remains attached to the original feature PRs; the manual physical legibility check remains explicitly unverified.

# Harness changes

None. Uses the already merged coordinated-handoff and verified-repair commands; no checks or ownership guards are weakened.
