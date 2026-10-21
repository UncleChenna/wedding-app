#!/usr/bin/env node
/**
 * Commit and PR text rules shared by the commit-msg hook and CI.
 * - No AI attribution: no Co-Authored-By trailers for AI agents or bots, no
 *   "Generated with…" lines, no robot emoji signatures.
 * - On a ticket branch (name contains TICKET-NNN) every commit subject starts "TICKET-NNN: ".
 */
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const AI_COAUTHOR =
  /^\s*co-authored-by:.*(claude|anthropic|codex|openai|chatgpt|gpt-|copilot|cursor|gemini|devin|noreply@anthropic|\[bot\]|bot@|users\.noreply\.github\.com.*bot)/im;

export function attributionProblems(text) {
  const problems = [];
  for (const line of text.split("\n")) {
    if (AI_COAUTHOR.test(line)) problems.push(`AI/bot co-author trailer: "${line.trim()}"`);
    if (/generated (with|by)\b/i.test(line)) problems.push(`AI attribution line: "${line.trim()}"`);
    if (/\u{1F916}/u.test(line)) problems.push(`robot emoji signature: "${line.trim()}"`);
  }
  return problems;
}

/** Strip git's comment lines and the scissors section, as git does before committing. */
export function cleanMessage(raw) {
  const scissors = raw.indexOf("# ------------------------ >8 ------------------------");
  return (scissors >= 0 ? raw.slice(0, scissors) : raw)
    .split("\n")
    .filter((l) => !l.startsWith("#"))
    .join("\n")
    .trim();
}

export function ticketProblems(message, branch) {
  const id = /(?:TICKET|WED)-\d{3}/.exec(branch ?? "")?.[0];
  if (!id) return [];
  const subject = message.split("\n")[0] ?? "";
  if (/^(Merge|Revert|fixup!|squash!|amend!)/.test(subject)) return [];
  return subject.startsWith(`${id}: `) && subject.length > id.length + 2
    ? []
    : [
        `On ${branch} every commit subject must start "${id}: ", e.g. "${id}: add RSVP form validation".`,
      ];
}

function branchName() {
  try {
    return execFileSync("git", ["branch", "--show-current"], { encoding: "utf8" }).trim();
  } catch {
    return "";
  }
}

function main() {
  const [mode, file] = process.argv.slice(2);
  let problems;
  if (mode === "commit-msg") {
    const message = cleanMessage(readFileSync(file, "utf8"));
    problems = [...attributionProblems(message), ...ticketProblems(message, branchName())];
  } else if (mode === "pr") {
    // CI passes untrusted PR text through environment variables, never through shell interpolation.
    const title = process.env.PR_TITLE ?? "";
    const body = process.env.PR_BODY ?? "";
    problems = attributionProblems(`${title}\n${body}`);
    if (
      !/^(?:TICKET|WED)-\d{3}: \S/.test(title) &&
      !/^(chore|docs|fix|feat|refactor|test|ci|build|perf|style|revert)(\(.+\))?!?: \S/.test(title)
    )
      problems.push(`PR title must start with a ticket id ("TICKET-014: …"): "${title}"`);
  } else {
    console.error("Usage: commit-rules.mjs commit-msg <file> | pr (reads PR_TITLE, PR_BODY)");
    process.exit(2);
  }
  if (problems.length) {
    console.error(
      `✖ Rejected:\n${problems.map((p) => `  - ${p}`).join("\n")}\nSee AGENTS.md → "No AI attribution".`,
    );
    process.exit(1);
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) main();
