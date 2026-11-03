import { spawn } from "node:child_process";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { expect, it } from "vitest";

import { isolatedGitEnv } from "./git-env";

const root = process.cwd();
it.each(["migration", "seed", "counts"] as const)(
  "%s rejects a wrong target before connecting",
  async (command) => {
    const cwd = realpathSync(mkdtempSync(join(tmpdir(), "target-command-")));
    let connections = 0;
    const server = createServer((socket) => {
      connections++;
      socket.destroy();
    });
    await new Promise<void>((done) => server.listen(0, "127.0.0.1", done));
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("No fixture port");
    const portBase = address.port === 25001 ? 26000 : 25000;
    try {
      mkdirSync(join(cwd, ".harness/supabase-project/supabase"), { recursive: true });
      writeFileSync(join(cwd, ".git"), "gitdir: /unused/fixture\n");
      writeFileSync(
        join(cwd, ".harness/worktree.json"),
        JSON.stringify({ path: cwd, project: "wedding-fixture", portBase }),
      );
      writeFileSync(
        join(cwd, ".harness/supabase-project/supabase/config.toml"),
        'project_id = "wedding-fixture"\n[db]\nport = ' + (portBase + 1) + "\n",
      );
      // A correct copied file must not hide an incorrect effective shell override.
      writeFileSync(
        join(cwd, ".env.local"),
        "DATABASE_URL=postgres://fixture:local-only@127.0.0.1:" + (portBase + 1) + "/postgres\n",
      );
      const args =
        command === "migration"
          ? [
              resolve(root, "node_modules/drizzle-kit/bin.cjs"),
              "migrate",
              "--config",
              resolve(root, "drizzle.config.ts"),
            ]
          : [
              "--import",
              import.meta.resolve("tsx"),
              resolve(root, command === "seed" ? "scripts/seed.ts" : "scripts/db-check.ts"),
              ...(command === "counts" ? ["counts"] : []),
            ];
      const result = await new Promise<{ code: number | null; output: string }>((done, reject) => {
        const child = spawn(process.execPath, args, {
          cwd,
          env: isolatedGitEnv({
            DATABASE_URL: "postgres://fixture:DO_NOT_LEAK@127.0.0.1:" + address.port + "/postgres",
          }),
          stdio: ["ignore", "pipe", "pipe"],
        });
        let output = "";
        const timeout = setTimeout(() => child.kill("SIGTERM"), 10000);
        child.stdout.on("data", (chunk: Buffer) => {
          output += chunk.toString();
        });
        child.stderr.on("data", (chunk: Buffer) => {
          output += chunk.toString();
        });
        child.on("error", (error) => {
          clearTimeout(timeout);
          reject(error);
        });
        child.on("close", (code) => {
          clearTimeout(timeout);
          done({ code, output });
        });
      });
      expect(result.output).toContain("Database target refused");
      expect(result.code).toBe(1);
      expect(result.output).not.toContain("DO_NOT_LEAK");
      expect(connections).toBe(0);
    } finally {
      await new Promise<void>((done) => server.close(() => done()));
      rmSync(cwd, { recursive: true, force: true });
    }
  },
  15000,
);
