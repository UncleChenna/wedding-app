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

function preflight(tool_name: string, tool_input: Record<string, string>) {
  return spawnSync(process.execPath, [hook, "pre", "codex"], {
    input: JSON.stringify({ cwd: process.cwd(), tool_name, tool_input }),
    encoding: "utf8",
  });
}

it.each([
  ["/tmp/ticket-hook-output.txt", 0],
  ["/tmp/.env.local", 2],
  [".env.local", 2],
  [".env.example", 0],
])("checks read access to %s", (file_path, status) => {
  expect(preflight("Read", { file_path }).status).toBe(status);
});

it.each([
  ["grep -n process.env src/x.ts | sed -n 1p", 0],
  ["cat node_modules/example/index.js | sed -n '1,10p'", 0],
  ["cp drizzle/0001.sql scratch.sql", 0],
  ["printf '%s' 'cp x drizzle/0001.sql > .env.local'", 0],
  ["sed -n '1p' drizzle/0001.sql", 0],
  ["sed -i s/a/b/ .env.local", 2],
  ["sed -i '' 's/a/b/' .env.local", 2],
  ["cp x drizzle/0001.sql", 2],
  ["cp -t drizzle x", 2],
  ["cp -tdrizzle x", 2],
  ["cp --target-directory=drizzle x", 2],
  ["mv drizzle/0001.sql scratch.sql", 2],
  ["printf hello > node_modules/example.js", 2],
  ["printf hello > '.env.local'", 2],
  ["printf hello | tee -a .env.local", 2],
  ["cat .env.local", 2],
  ["grep TOKEN .env.local", 2],
  ["cp .env.local scratch.txt", 2],
  ["cat < .env.local", 2],
  ["echo hello 2>&1", 0],
  ["cp x /tmp/ticket-hook-out.txt", 2],
  ["cd /tmp && cp x ticket-hook-out.txt", 2],
])("classifies shell accesses: %s", (command, status) => {
  const result = preflight("Bash", { command });
  expect(result.status, result.stderr).toBe(status);
});

it("confines edits while allowing non-secret external reads and resolving symlinks", async () => {
  const { mkdtempSync, symlinkSync, writeFileSync, rmSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const dir = mkdtempSync(join(tmpdir(), "ticket-002-access-"));
  try {
    const plain = join(dir, "output.txt");
    const secret = join(dir, ".env.local");
    const alias = join(dir, "alias.txt");
    writeFileSync(plain, "synthetic output");
    writeFileSync(secret, "synthetic test fixture, not credentials");
    symlinkSync(secret, alias);
    expect(preflight("Read", { file_path: plain }).status).toBe(0);
    expect(preflight("Write", { file_path: plain }).status).toBe(2);
    expect(preflight("Read", { file_path: alias }).status).toBe(2);
    expect(preflight("Bash", { command: `cat '${alias}'` }).status).toBe(2);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
