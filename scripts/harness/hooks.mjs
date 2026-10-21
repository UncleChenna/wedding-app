#!/usr/bin/env node
import { fileURLToPath } from "node:url";
import { existsSync, lstatSync, readFileSync, realpathSync } from "node:fs";
import { dirname, relative, resolve, sep } from "node:path";
import { spawnSync } from "node:child_process";
import { shellAccess } from "./shell-access.mjs";
import { protectedPath } from "./core.mjs";
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
function normalized(cwd, file) {
  const path = resolvedPath(cwd, file);
  const rel = relative(realpathSync(cwd), path);
  if (rel.startsWith(`..${sep}`) || rel === ".." || resolve(cwd, rel) !== path)
    throw new Error("Edit outside this checkout denied.");
  return rel.replaceAll(sep, "/");
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
  const result = spawnSync(process.platform === "win32" ? "pnpm.cmd" : "pnpm", args, {
    cwd,
    encoding: "utf8",
    shell: process.platform === "win32",
  });
  if (result.status !== 0)
    throw new Error(
      `pnpm ${args.join(" ")} failed:\n${(result.stdout ?? "").slice(-6000)}\n${(result.stderr ?? result.error?.message ?? "").slice(-6000)}`,
    );
}
function verifyProtected(cwd, paths, staged = false) {
  for (const path of paths)
    if (protectedPath(path) && !approved(cwd, path, staged))
      throw new Error(
        `Protected file ${path}: a human must record exact-path authorization in .harness/approved-writes.json (see docs/collaboration.md).`,
      );
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
      else
        verifyProtected(
          cwd,
          paths.map((path) => normalized(cwd, path)),
        );
      const tool = input.tool_input ?? input;
      const shell = tool.command ?? tool.cmd ?? "";
      if (/\bgit\b[^\n]*\bcommit\b/.test(shell) && isMain(git(["branch", "--show-current"], cwd)))
        throw new Error("No commits on main or develop. Create a task branch/worktree.");
      const access = shellAccess(shell, cwd);
      access.reads.forEach((path) => verifyRead(cwd, path));
      verifyProtected(
        cwd,
        access.writes.map((path) => normalized(cwd, path)),
      );
    } else if (mode === "post") {
      if (!/edit|write|patch|bash|shell|exec/i.test(input.tool_name ?? "") && !input.file_path) {
        console.log("{}");
        return;
      }
      const paths = [
        ...new Set([...editPaths(input).map((p) => normalized(cwd, p)), ...changed(cwd)]),
      ];
      verifyProtected(cwd, paths);
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
      verifyProtected(cwd, changed(cwd));
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
