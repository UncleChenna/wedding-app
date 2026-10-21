# 0012 — Shared hooks with independent Git and CI gates

- Status: Accepted · 2026-10-21

**Context.** Existing Claude hooks silently ignored formatter failures and eventually allowed a failing stop. Other agents and humans need the same checks.

**Decision.** One Node hook implementation handles protected paths, formatting/lint, branch checks and quick verification. Claude, Codex and Cursor configuration use their documented event/output formats. Stop failures never become passes after a retry count. Husky mirrors critical gates; GitHub protection requires the full CI gate and the other person's review. Human-approved protected changes are explicit, scoped, expiring local records.

**Consequences.** Hooks are fallible local workflow controls, not a security sandbox. Shell code can evade lexical prechecks; post-tool/staged checks and remote CI provide additional detection. Humans may interrupt blocked sessions but cannot label them complete. Optional AI review is disabled until a human approves spending and supplies a secret; no paid service is activated by this task.
