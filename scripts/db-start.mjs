#!/usr/bin/env node
// Compatibility entrypoint; the canonical implementation handles worktree identity.
process.argv[2] = "start";
await import("./db-local.mjs");
