#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { cli, common, pnpm, root } from "./harness/io.mjs";
import { liveTicket, nextTicket, ticketOwner } from "./harness/tickets.mjs";

/**
 * Headless loop: t:next → t:claim → wt:new → t:move in_progress → Claude runs
 * the ticket-workflow skill → t:pr (verify, push, PR, in_review). One ticket
 * per iteration; any failure stops the loop with the claim retained.
 */
cli(async () => {
  const args = process.argv.slice(2);
  if (args.includes("--help")) {
    console.log(
      "agent:loop [--ticket TICKET-NNN] [--module MODULE] [--max-iterations N] [--model M] [--max-budget-usd N] [--dry-run]. Runs Claude in one isolated worktree per ticket, then verifies and opens its PR.",
    );
    return;
  }
  const option = (key, fallback) => (args.includes(key) ? args[args.indexOf(key) + 1] : fallback);
  const supported = new Set([
    "--ticket",
    "--module",
    "--max-iterations",
    "--model",
    "--max-budget-usd",
  ]);
  for (let n = 0; n < args.length; n++) {
    if (args[n] === "--dry-run") continue;
    if (!supported.has(args[n]) || !args[n + 1] || args[n + 1].startsWith("--"))
      throw new Error(`Unknown or incomplete option: ${args[n]}`);
    n++;
  }
  const max = Number(option("--max-iterations", "1"));
  if (!Number.isInteger(max) || max < 1) throw new Error("Invalid iteration count.");
  const cwd = root();
  const owner = ticketOwner(cwd);
  const agent = "claude";
  for (let i = 0; i < max; i++) {
    const requested = option("--ticket", null);
    const ticket = requested
      ? liveTicket(cwd, requested)
      : nextTicket(cwd, option("--module", null));
    if (!ticket) {
      console.log("No ready ticket.");
      return;
    }
    if (args.includes("--dry-run")) {
      console.log(
        `Would claim ${ticket.id} (${ticket.title}), create its worktree, move it to in_progress, run the ticket-workflow skill, verify and open a PR.`,
      );
      return;
    }
    if (!ticket.owner) pnpm(["t:claim", ticket.id, "--owner", owner, "--agent", agent], cwd);
    pnpm(["wt:new", ticket.id], cwd);
    const path = join(dirname(common(cwd)), ".worktrees", ticket.id);
    if (liveTicket(path, ticket.id).status === "todo")
      pnpm(
        ["t:move", ticket.id, "in_progress", "--owner", owner, "--agent", agent, "--push"],
        path,
      );
    const result = spawnSync(
      "claude",
      [
        "-p",
        `Use the ticket-workflow skill for ${ticket.id}. It is already claimed by ${owner}, in_progress, and this is its managed worktree. Work through steps 4–5; stop after committing with every acceptance criterion ticked. The outer harness runs pnpm t:pr.`,
        "--permission-mode",
        "acceptEdits",
        "--output-format",
        "text",
        ...(option("--model", null) ? ["--model", option("--model", null)] : []),
        ...(option("--max-budget-usd", null)
          ? ["--max-budget-usd", option("--max-budget-usd", null)]
          : []),
      ],
      { cwd: path, stdio: "inherit", env: { ...process.env, TICKETS_AGENT: agent } },
    );
    if (result.status !== 0)
      throw new Error(
        `Agent failed on ${ticket.id}; claim retained. Write a handoff or move it to blocked.`,
      );
    pnpm(["t:pr", ticket.id, "--owner", owner], path);
    if (requested) return;
  }
});
