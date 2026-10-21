import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { editPaths } from "../harness/hooks.mjs";
import { isolatedGitEnv } from "./git-env";
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

it("formats changed regular files but skips symlinks and directories (TICKET-001)", async () => {
  const { mkdtempSync, mkdirSync, writeFileSync, chmodSync, rmSync, readFileSync, symlinkSync } =
    await import("node:fs");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const dir = mkdtempSync(join(tmpdir(), "wedding-hook-symlink-"));
  const git = (...args: string[]) =>
    spawnSync("git", args, { cwd: join(dir, "repo"), encoding: "utf8", env: isolatedGitEnv() });
  try {
    const repo = join(dir, "repo");
    mkdirSync(join(repo, ".agents/skills/x"), { recursive: true });
    mkdirSync(join(repo, ".claude"));
    writeFileSync(join(repo, ".agents/skills/x/SKILL.md"), "# x\n");
    writeFileSync(join(repo, "notes.md"), "a\n");
    git("init", "-q", "-b", "chore/x");
    git("-c", "user.email=t@example.test", "-c", "user.name=T", "add", ".");
    git("-c", "user.email=t@example.test", "-c", "user.name=T", "commit", "-qm", "chore: init");
    // A changed regular file and a new (untracked) symlink, as agents:link creates.
    writeFileSync(join(repo, "notes.md"), "b\n");
    symlinkSync("../.agents/skills", join(repo, ".claude/skills"));
    // Fake pnpm: log every formatted path; fail like Prettier does on a symlink.
    const log = join(dir, "calls.log");
    const fake = join(dir, "pnpm");
    writeFileSync(
      fake,
      `#!/bin/sh\nfor last; do :; done\necho "$last" >> "${log}"\nif [ -L "$last" ] || [ -d "$last" ]; then echo "is a symbolic link" >&2; exit 2; fi\nexit 0\n`,
    );
    chmodSync(fake, 0o755);
    const result = spawnSync(process.execPath, [hook, "post", "claude"], {
      input: JSON.stringify({ cwd: repo, tool_name: "Bash", tool_input: { command: "ls" } }),
      encoding: "utf8",
      env: isolatedGitEnv({ PATH: `${dir}:${process.env.PATH}` }),
    });
    expect(result.stderr).toBe("");
    expect(result.status).toBe(0);
    const calls = readFileSync(log, "utf8");
    expect(calls).toContain("notes.md");
    expect(calls).not.toContain(".claude/skills");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

it("isolates throwaway-repo git calls from the git hook environment", () => {
  const saved = { dir: process.env.GIT_DIR, index: process.env.GIT_INDEX_FILE };
  process.env.GIT_DIR = "/real/repo/.git";
  process.env.GIT_INDEX_FILE = "/real/repo/.git/index";
  try {
    const env = isolatedGitEnv({ PATH: "/x" });
    const leaked = Object.keys(env).filter(
      (key) => key.startsWith("GIT_") && key !== "GIT_CONFIG_NOSYSTEM",
    );
    expect(leaked).toEqual([]);
    expect(env.PATH).toBe("/x");
  } finally {
    if (saved.dir === undefined) delete process.env.GIT_DIR;
    else process.env.GIT_DIR = saved.dir;
    if (saved.index === undefined) delete process.env.GIT_INDEX_FILE;
    else process.env.GIT_INDEX_FILE = saved.index;
  }
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
