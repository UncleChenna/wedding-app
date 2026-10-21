/**
 * Thin bridge so the plain-Node harness scripts (worktrees, agent loop) can read
 * live ticket state through the ticket CLI instead of duplicating its rules.
 */
import { git, run } from "./io.mjs";

const pnpmBin = process.platform === "win32" ? "pnpm.cmd" : "pnpm";

export function ticketOwner(cwd) {
  let value = process.env.AGENT_OWNER;
  if (!value) {
    try {
      value = git(["config", "--get", "harness.owner"], cwd);
    } catch {
      /* reported below */
    }
  }
  if (!value) throw new Error("Set your identity once: git config harness.owner <name>.");
  return value;
}

/** Effective (files + shared ledger) frontmatter for one ticket. */
export function liveTicket(cwd, id) {
  return JSON.parse(run(pnpmBin, ["-s", "t:show", id, "--json"], { cwd }));
}

/** The best ready ticket, or null. */
export function nextTicket(cwd, module) {
  const out = run(pnpmBin, ["-s", "t:next", "--json", ...(module ? ["--module", module] : [])], {
    cwd,
  });
  return out.startsWith("{") ? JSON.parse(out) : null;
}

export function pnpmCommand(args, cwd) {
  return run(pnpmBin, args, { cwd });
}
