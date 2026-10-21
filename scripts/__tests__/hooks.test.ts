import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { editPaths } from "../harness/hooks.mjs";
const hook = resolve("scripts/harness/hooks.mjs");
describe("agent hook adapters", () => {
  it("extracts every file from a Codex patch including rename targets", () => {
    expect(
      editPaths({
        tool_input: {
          command: "*** Update File: src/a.ts\n*** Move to: .env.local\n*** Add File: src/b.ts",
        },
      }),
    ).toEqual(["src/a.ts", ".env.local", "src/b.ts"]);
  });
  it.each(["claude", "codex", "cursor"])(
    "blocks secret edits for %s without reading or changing the file",
    (adapter) => {
      const output = spawnSync(process.execPath, [hook, "pre", adapter], {
        input: JSON.stringify({
          tool_name: "Write",
          tool_input: { file_path: ".env.local" },
          cwd: process.cwd(),
        }),
        encoding: "utf8",
      });
      if (adapter === "cursor") expect(JSON.parse(output.stdout).permission).toBe("deny");
      else {
        expect(output.status).toBe(2);
        expect(output.stderr).toContain("Protected file");
      }
    },
  );
  it("blocks malformed hook requests", () => {
    const output = spawnSync(process.execPath, [hook, "pre", "codex"], {
      input: "{",
      encoding: "utf8",
    });
    expect(output.status).toBe(2);
  });
});

it("never accepts a failing stop after repeated attempts", async () => {
  const { mkdtempSync, writeFileSync, chmodSync, rmSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const dir = mkdtempSync(join(tmpdir(), "wedding-hook-test-"));
  try {
    const fake = join(dir, "pnpm");
    writeFileSync(fake, "#!/bin/sh\necho 'verification failed' >&2\nexit 1\n");
    chmodSync(fake, 0o755);
    for (let attempt = 0; attempt < 4; attempt++) {
      const result = spawnSync(process.execPath, [hook, "stop", "codex"], {
        input: JSON.stringify({ cwd: process.cwd(), stop_hook_active: attempt > 0 }),
        encoding: "utf8",
        env: { ...process.env, PATH: `${dir}:${process.env.PATH}` },
      });
      expect(result.status).toBe(2);
      expect(result.stderr).toContain("verification failed");
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

it("allows reading generated migrations while blocking writes", () => {
  const input = {
    cwd: process.cwd(),
    tool_name: "Read",
    tool_input: { file_path: "drizzle/0000_init.sql" },
  };
  const read = spawnSync(process.execPath, [hook, "pre", "codex"], {
    input: JSON.stringify(input),
    encoding: "utf8",
  });
  expect(read.status).toBe(0);
  const write = spawnSync(process.execPath, [hook, "pre", "codex"], {
    input: JSON.stringify({ ...input, tool_name: "Write" }),
    encoding: "utf8",
  });
  expect(write.status).toBe(2);
});

it("rejects direct pushes to main", () => {
  const result = spawnSync(process.execPath, [hook, "push"], {
    input: "refs/heads/feature abc refs/heads/main def\n",
    encoding: "utf8",
  });
  expect(result.status).toBe(2);
  expect(result.stderr).toContain("Direct pushes to main");
});

it("rejects direct pushes to develop", () => {
  const result = spawnSync(process.execPath, [hook, "push"], {
    input: "refs/heads/TICKET-188 abc refs/heads/develop def\n",
    encoding: "utf8",
  });
  expect(result.status).toBe(2);
  expect(result.stderr).toContain("Direct pushes to main/develop");
});
