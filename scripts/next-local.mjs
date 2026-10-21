import { existsSync } from "node:fs";
import { spawn } from "node:child_process";
import { json } from "./harness/io.mjs";
const [mode, ...args] = process.argv.slice(2);
const meta = existsSync(".harness/worktree.json") ? json(".harness/worktree.json") : null;
const explicit = args.some((a) => a === "--port" || a === "-p" || a.startsWith("--port="));
const child = spawn(
  process.execPath,
  [
    "node_modules/next/dist/bin/next",
    mode,
    ...args,
    ...(!explicit && meta ? ["--port", String(meta.devPort)] : []),
  ],
  { stdio: "inherit" },
);
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => child.kill(signal));
child.on("exit", (code) => {
  process.exitCode = code ?? 1;
});
