#!/usr/bin/env node
import {
  cpSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(root, ".agents/skills");
const target = join(root, ".claude/skills");
const check = process.argv.includes("--check");
function snapshot(dir) {
  return readdirSync(dir, { withFileTypes: true })
    .sort((a, b) => a.name.localeCompare(b.name))
    .flatMap((e) =>
      e.isDirectory()
        ? snapshot(join(dir, e.name)).map(([p, c]) => [`${e.name}/${p}`, c])
        : [[e.name, readFileSync(join(dir, e.name), "utf8")]],
    );
}
const skills = readdirSync(source, { withFileTypes: true }).filter((e) => e.isDirectory());
for (const s of skills) {
  const text = readFileSync(join(source, s.name, "SKILL.md"), "utf8");
  if (!text.startsWith(`---\nname: ${s.name}\n`) || !/^description: .+/m.test(text))
    throw new Error(`Invalid skill: ${s.name}`);
}
if (check) {
  if (!existsSync(target) || JSON.stringify(snapshot(source)) !== JSON.stringify(snapshot(target)))
    throw new Error("Skill links/copies are stale: run pnpm agents:link.");
  // .claude/skills is generated per clone and gitignored; a committed copy breaks hooks and links.
  const tracked = execFileSync("git", ["ls-files", "--", ".claude/skills"], {
    cwd: root,
    encoding: "utf8",
  }).trim();
  if (tracked)
    throw new Error(
      ".claude/skills is committed but must stay generated: run git rm -r --cached .claude/skills.",
    );
} else {
  mkdirSync(dirname(target), { recursive: true });
  if (
    existsSync(target) &&
    !lstatSync(target).isSymbolicLink() &&
    !(
      lstatSync(target).isFile() &&
      readFileSync(target, "utf8").trim().replaceAll("\\", "/") === "../.agents/skills"
    ) &&
    !existsSync(join(root, ".harness/skill-copy.json"))
  )
    throw new Error("Unmanaged .claude/skills directory; move it aside before linking.");
  if (
    existsSync(target) ||
    (() => {
      try {
        return lstatSync(target).isSymbolicLink();
      } catch {
        return false;
      }
    })()
  )
    rmSync(target, { recursive: true, force: true });
  try {
    if (process.argv.includes("--copy")) throw new Error("Copy requested");
    symlinkSync(
      process.platform === "win32" ? source : relative(dirname(target), source),
      target,
      process.platform === "win32" ? "junction" : "dir",
    );
  } catch {
    cpSync(source, target, { recursive: true });
    mkdirSync(join(root, ".harness"), { recursive: true });
    writeFileSync(join(root, ".harness/skill-copy.json"), "{}\n");
  }
}
const claude = join(root, "CLAUDE.md");
if (!existsSync(claude) || !/^@(?:\.\/)?AGENTS\.md$/m.test(readFileSync(claude, "utf8"))) {
  if (check) throw new Error("CLAUDE.md must import AGENTS.md.");
  writeFileSync(claude, `@AGENTS.md\n${existsSync(claude) ? readFileSync(claude, "utf8") : ""}`);
}
// Keep the PR checklist synchronized with its canonical document.
const checklist = readFileSync(join(root, "docs/ui-checklist.md"), "utf8")
  .split("\n")
  .filter((line) => line.startsWith("- [ ]"))
  .join("\n");
const templatePath = join(root, ".github/pull_request_template.md");
if (existsSync(templatePath)) {
  const current = readFileSync(templatePath, "utf8");
  const start = current.indexOf("- [ ]");
  const end = current.indexOf("\n# Harness changes");
  if (start < 0 || end < start) throw new Error("PR template checklist markers missing.");
  const updated = current.slice(0, start) + checklist + "\n" + current.slice(end);
  if (check && updated !== current) throw new Error("PR checklist is stale: run pnpm agents:link.");
  if (!check) writeFileSync(templatePath, updated);
}
console.log(
  `${skills.length} shared skills: Codex/Cursor use .agents/skills; Claude uses ${realpathSync(target) === source ? "a symlink" : "a refreshed copy"}.`,
);
