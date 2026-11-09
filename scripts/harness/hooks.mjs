#!/usr/bin/env node
import { fileURLToPath } from "node:url";
import { existsSync, lstatSync, readFileSync, realpathSync } from "node:fs";
import { dirname, relative, resolve, sep } from "node:path";
import { spawnSync } from "node:child_process";
import { pnpmRuntime } from "./pnpm-runtime.mjs";
import { shellAccess } from "./shell-access.mjs";
import { tmpdir } from "node:os";
import { unchangedDevelopArtifact } from "./develop-artifacts.mjs";
import { destructiveSql, journalOnlyAppends, migrationPath, protectedPath } from "./core.mjs";
import { git, isMain, root } from "./io.mjs";

export function editPaths(input) {
  const tool = input.tool_input ?? input;
  const paths = [tool.file_path, tool.path, input.file_path].filter((v) => typeof v === "string");
  const patch = typeof tool === "string" ? tool : (tool.command ?? tool.patch ?? "");
  for (const match of patch.matchAll(
    /^\*\*\* (?:Add File|Update File|Delete File|Move to): (.+)$/gm,
  ))
    paths.push(match[1]);
  return [...new Set(paths)];
}
function approved(cwd, path, staged = false) {
  if (staged && unchangedDevelopArtifact(cwd, path)) return true;
  const file = resolve(cwd, ".harness/approved-writes.json");
  if (!existsSync(file)) return false;
  const approval = JSON.parse(readFileSync(file, "utf8"));
  if (
    !approval.reason ||
    Date.parse(approval.expires_at) < Date.now() ||
    !Number.isFinite(Date.parse(approval.expires_at))
  )
    return false;
  if (!approval.paths?.includes(path)) return false;
  // Human approval names exact paths; generated artifacts remain subject to normal verification.
  return !staged || !/(^|\/)\.env(?!\.example$)/.test(path);
}
function resolvedPath(cwd, file) {
  let path = resolve(cwd, file);
  // Resolve existing parent symlinks even for a newly created file.
  let parent = path;
  while (!existsSync(parent) && dirname(parent) !== parent) parent = dirname(parent);
  path = resolve(realpathSync(parent), relative(parent, path));
  return path;
}
/** Throwaway locations an agent may write outside its checkout: /dev/null and temp folders. */
function scratchPath(path) {
  if (path === "/dev/null") return true;
  const roots = [tmpdir(), "/tmp", "/private/tmp", "/var/folders", "/private/var/folders"]
    .filter((dir) => existsSync(dir))
    .map((dir) => realpathSync(dir));
  return roots.some((dir) => path === dir || path.startsWith(dir + sep));
}
/** A checkout-relative path, or null for an allowed scratch path outside the checkout. */
function normalized(cwd, file) {
  const path = resolvedPath(cwd, file);
  const rel = relative(realpathSync(cwd), path);
  if (rel.startsWith(`..${sep}`) || rel === ".." || resolve(cwd, rel) !== path) {
    if (scratchPath(path)) return null;
    // Other checkouts (another person's worktree, the main repo) stay off limits.
    throw new Error("Edit outside this checkout denied.");
  }
  return rel.replaceAll(sep, "/");
}
const inCheckout = (cwd, paths) => paths.map((path) => normalized(cwd, path)).filter(Boolean);
/** The commit migrations are compared with: what has reached develop, else HEAD. */
function migrationBase(cwd) {
  for (const ref of ["origin/develop", "develop"]) {
    try {
      return git(["merge-base", "HEAD", ref], cwd);
    } catch {
      // Try the next reference.
    }
  }
  try {
    return git(["rev-parse", "HEAD"], cwd);
  } catch {
    return null;
  }
}
function atBase(cwd, base, path) {
  if (!base) return null;
  try {
    return git(["show", `${base}:${path}`], cwd);
  } catch {
    return null;
  }
}
function current(cwd, path, staged) {
  try {
    return staged ? git(["show", `:${path}`], cwd) : readFileSync(resolve(cwd, path), "utf8");
  } catch {
    return null;
  }
}
/**
 * TICKET-217: `pnpm db:generate` output needs no approval. New migration and snapshot files pass,
 * and the journal passes while it only appends. Anything already on develop stays locked, and
 * destructive SQL still needs the owner (checked when committing).
 */
function generatedMigration(cwd, path, staged) {
  if (!migrationPath(path)) return false;
  const base = migrationBase(cwd);
  const before = atBase(cwd, base, path);
  const now = current(cwd, path, staged);
  if (path === "drizzle/meta/_journal.json")
    return (
      now !== null &&
      (() => {
        try {
          return journalOnlyAppends(before, now);
        } catch {
          return false;
        }
      })()
    );
  if (before !== null) return false;
  if (staged && path.endsWith(".sql") && now !== null && destructiveSql(now))
    throw new Error(
      `Migration ${path} drops, retypes, renames or deletes data. Ask the owner first; with their yes, record it in .harness/approved-writes.json (see docs/collaboration.md).`,
    );
  return true;
}
function verifyRead(cwd, file) {
  // Check both the requested name and resolved target: aliases cannot expose secrets.
  const secret = /(^|[\\/])\.env(?!\.example(?:[\\/]|$))(?:[^\\/]*)(?:[\\/]|$)/;
  if (secret.test(file) || secret.test(resolvedPath(cwd, file)))
    throw new Error("Protected file: secret environment files cannot be read.");
}
function changed(cwd, staged = false) {
  const args = staged
    ? ["diff", "--cached", "--name-only", "--diff-filter=ACMRD", "--no-renames", "-z"]
    : ["diff", "HEAD", "--name-only", "--diff-filter=ACMRD", "--no-renames", "-z"];
  const tracked = git(args, cwd).split("\0").filter(Boolean);
  return [
    ...new Set([
      ...tracked,
      ...(staged
        ? []
        : git(["ls-files", "--others", "--exclude-standard", "-z"], cwd)
            .split("\0")
            .filter(Boolean)),
    ]),
  ];
}
function command(cwd, args) {
  const runtime = pnpmRuntime();
  const result = spawnSync(runtime.executable, args, {
    env: runtime.env,
    cwd,
    encoding: "utf8",
    shell: process.platform === "win32",
  });
  if (result.status !== 0)
    throw new Error(
      `pnpm ${args.join(" ")} failed:\n${(result.stdout ?? "").slice(-6000)}\n${(result.stderr ?? result.error?.message ?? "").slice(-6000)}`,
    );
}
function blockedPaths(cwd, paths, staged = false) {
  return paths.filter(
    (path) =>
      protectedPath(path) && !approved(cwd, path, staged) && !generatedMigration(cwd, path, staged),
  );
}
function protectedMessage(path) {
  return `Protected file ${path}: get the owner's yes, then record it in .harness/approved-writes.json (see docs/collaboration.md).`;
}
function verifyProtected(cwd, paths, staged = false) {
  const [path] = blockedPaths(cwd, paths, staged);
  if (path) throw new Error(protectedMessage(path));
}
/** Reports protected changes once without blocking; the commit hook is the enforcement point. */
function warnProtected(cwd, paths) {
  for (const path of blockedPaths(cwd, paths))
    console.error(`Note: ${protectedMessage(path)} It will be refused at commit until then.`);
}
export async function main() {
  const [mode, adapter = "claude"] = process.argv.slice(2);
  let input = {};
  if (["pre", "post", "stop"].includes(mode)) {
    const raw = readFileSync(0, "utf8");
    if (raw.trim()) input = JSON.parse(raw);
  }
  const cwd = root(input.cwd ?? input.workspace_roots?.[0] ?? process.cwd());
  try {
    if (mode === "pre") {
      const paths = editPaths(input);
      const isRead = /^(Read|read_file)$/i.test(input.tool_name ?? "");
      if (isRead) paths.forEach((path) => verifyRead(cwd, path));
      else verifyProtected(cwd, inCheckout(cwd, paths));
      const tool = input.tool_input ?? input;
      const shell = tool.command ?? tool.cmd ?? "";
      if (/\bgit\b[^\n]*\bcommit\b/.test(shell) && isMain(git(["branch", "--show-current"], cwd)))
        throw new Error("No commits on main or develop. Create a task branch/worktree.");
      const access = shellAccess(shell, cwd);
      access.reads.forEach((path) => verifyRead(cwd, path));
      verifyProtected(cwd, inCheckout(cwd, access.writes));
    } else if (mode === "post") {
      if (!/edit|write|patch|bash|shell|exec/i.test(input.tool_name ?? "") && !input.file_path) {
        console.log("{}");
        return;
      }
      const paths = [...new Set([...inCheckout(cwd, editPaths(input)), ...changed(cwd)])];
      // Direct edits were already checked before the tool ran. Generator or shell output is
      // reported here once rather than failing every later tool call (TICKET-217).
      warnProtected(cwd, paths);
      for (const path of paths) {
        if (!existsSync(resolve(cwd, path)) || protectedPath(path)) continue;
        // Only regular files are formattable. Symlinks (e.g. the .claude/skills link that
        // agents:link creates) and directories make Prettier fail on every tool call.
        if (!lstatSync(resolve(cwd, path)).isFile()) continue;
        command(cwd, ["exec", "prettier", "--write", "--ignore-unknown", path]);
        if (/\.[cm]?[jt]sx?$/.test(path))
          command(cwd, ["exec", "eslint", "--fix", "--max-warnings=0", "--no-warn-ignored", path]);
      }
    } else if (mode === "commit") {
      if (isMain(git(["branch", "--show-current"], cwd)) || !git(["branch", "--show-current"], cwd))
        throw new Error(
          "Commits require a named task branch, never main, develop or detached HEAD.",
        );
      verifyProtected(cwd, changed(cwd, true), true);
      command(cwd, ["exec", "lint-staged"]);
      command(cwd, ["verify:quick"]);
    } else if (mode === "push") {
      const refs = readFileSync(0, "utf8");
      if (
        refs
          .split("\n")
          .some((line) =>
            ["refs/heads/main", "refs/heads/master", "refs/heads/develop"].includes(
              line.split(" ")[2],
            ),
          )
      )
        throw new Error("Direct pushes to main/develop are blocked. Use a reviewed PR.");
    } else if (mode === "stop") {
      // A file waiting on the owner must not trap the session; the commit hook still refuses it.
      warnProtected(cwd, changed(cwd));
      command(cwd, ["verify:quick"]);
    } else throw new Error("Unknown hook mode.");
    if (["pre", "post", "stop"].includes(mode)) console.log("{}");
  } catch (error) {
    if (adapter === "cursor" && mode === "pre")
      console.log(
        JSON.stringify({
          permission: "deny",
          user_message: error.message,
          agent_message: error.message,
        }),
      );
    else if (adapter === "cursor" && mode === "stop")
      console.log(
        JSON.stringify({
          followup_message: `Checks failed. Fix before completion: ${error.message}`,
        }),
      );
    else {
      console.error(error.message);
      process.exitCode = 2;
    }
  }
}
if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]))
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 2;
  });
