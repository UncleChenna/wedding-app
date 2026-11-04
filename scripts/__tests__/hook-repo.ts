import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { isolatedGitEnv } from "./git-env";

/** Hook tests inspect a disposable repository and leave the real checkout alone. */
export function hookRepo(branch = "TICKET-999") {
  const path = mkdtempSync(join(tmpdir(), "wedding-hook-repo-"));
  const env = isolatedGitEnv({ GIT_CONFIG_GLOBAL: join(path, "absent-global-config") });
  const git = (...args: string[]) => {
    const result = spawnSync("git", args, { cwd: path, env, encoding: "utf8" });
    if (result.status !== 0) throw new Error(result.stderr || "Fixture Git failed");
    return result.stdout.trim();
  };
  try {
    git("init", "-q");
    git("symbolic-ref", "HEAD", "refs/heads/" + branch);
    writeFileSync(join(path, "notes.md"), "Synthetic hook fixture\n");
    git("add", "notes.md");
    git(
      "-c",
      "user.name=Fixture",
      "-c",
      "user.email=fixture@example.test",
      "commit",
      "-qm",
      "chore: fixture",
    );
  } catch (error) {
    rmSync(path, { recursive: true, force: true });
    throw error;
  }
  return { path, env, git, cleanup: () => rmSync(path, { recursive: true, force: true }) };
}
