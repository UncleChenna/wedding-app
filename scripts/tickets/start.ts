import type { Status } from "./model";

/** The steps `pnpm t:start <id>` runs, in order (TICKET-218). */
export type StartStep = "todo" | "claim" | "worktree" | "in_progress";

export interface StartOptions {
  id: string;
  owner: string;
  agent?: string;
  ahead?: boolean;
  /** Start the database now instead of on first use. */
  db?: boolean;
}

/**
 * The pnpm command for each step and whether it runs in the new worktree. The move to
 * in_progress runs there, so the worktree's fresh develop scripts do it.
 */
export function startCommands(o: StartOptions): Record<StartStep, { args: string[]; inWorktree: boolean }> {
  const ahead = o.ahead ? ["--ahead"] : [];
  return {
    todo: { args: ["t:move", o.id, "todo"], inWorktree: false },
    claim: {
      args: ["t:claim", o.id, "--owner", o.owner, ...(o.agent ? ["--agent", o.agent] : []), ...ahead],
      inWorktree: false,
    },
    worktree: { args: ["wt:new", o.id, ...(o.db ? ["--db"] : [])], inWorktree: false },
    in_progress: { args: ["t:move", o.id, "in_progress", "--push", ...ahead], inWorktree: true },
  };
}

/**
 * Plans a one-command start from wherever the ticket is:
 * - a backlog ticket goes all the way,
 * - a ticket you already claimed (still `todo`) skips the claim,
 * - re-running on your in-progress ticket only (re)creates its worktree.
 * Anyone else's ticket, or a finished one, is refused.
 */
export function startPlan(meta: { status: Status; owner: string }, me: string): StartStep[] {
  const mine = meta.owner === me;
  if (meta.owner && !mine) throw new Error(`Owned by ${meta.owner}; pick another ticket.`);
  if (meta.status === "backlog") return ["todo", "claim", "worktree", "in_progress"];
  if (meta.status === "todo") return mine ? ["worktree", "in_progress"] : ["claim", "worktree", "in_progress"];
  if (meta.status === "in_progress" && mine) return ["worktree"];
  throw new Error(
    `It is ${meta.status}; t:start only starts backlog or todo tickets, or resumes your own.`,
  );
}
