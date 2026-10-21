import { ACTIVE_STATUSES, TRANSITIONS } from "./model";
import type { ActiveStatus, Frontmatter, LedgerFields, Status } from "./model";

export class TransitionError extends Error {
  override name = "TransitionError";
}

/** Facts gathered by the CLI (git, gh, verify). Pure rules below decide with them. */
export interface MoveFacts {
  /** Who is acting (harness.owner / --owner). */
  actor: string;
  agent: string;
  today: string;
  reason?: string;
  /** Effective status of every ticket, for blocker checks. */
  statusOf: (id: string) => Status | undefined;
  /** Current git branch of the checkout running the command. */
  branch?: string;
  /** in_review: working tree clean, HEAD pushed, `pnpm verify` passed, PR open. */
  clean?: boolean;
  pushed?: boolean;
  verified?: boolean;
  openPr?: string;
  /** done: the PR is merged. */
  mergedPr?: string;
  /** in_review and done: every acceptance criterion is ticked. */
  criteriaTicked?: boolean;
}

export type Change = Partial<LedgerFields>;

const unfinished = (meta: Frontmatter, facts: MoveFacts) =>
  meta.blocked_by.filter((id) => facts.statusOf(id) !== "done");

function requireOwner(meta: Frontmatter, facts: MoveFacts) {
  if (meta.owner && meta.owner !== facts.actor)
    throw new TransitionError(
      `${meta.id} belongs to ${meta.owner}; ${facts.actor} may not change it. Coordinate with the owner.`,
    );
}

export function claim(meta: Frontmatter, facts: MoveFacts, branch: string): Change {
  if (meta.status !== "todo")
    throw new TransitionError(`${meta.id} is ${meta.status}; only todo tickets can be claimed.`);
  if (meta.owner) throw new TransitionError(`${meta.id} is already claimed by ${meta.owner}.`);
  const open = unfinished(meta, facts);
  if (open.length) throw new TransitionError(`${meta.id} is still blocked by ${open.join(", ")}.`);
  if (!facts.actor || !facts.agent)
    throw new TransitionError(
      "Claims need --owner and --agent (or harness.owner / TICKETS_AGENT).",
    );
  return { owner: facts.actor, agent: facts.agent, branch, updated: facts.today };
}

export function release(meta: Frontmatter, facts: MoveFacts): Change {
  requireOwner(meta, facts);
  if (meta.status !== "todo" || !meta.owner)
    throw new TransitionError(`${meta.id} can only be released while claimed and todo.`);
  return { owner: "", agent: "", branch: "", updated: facts.today };
}

/** Validate a move and return the fields that change. Throws TransitionError when illegal. */
export function move(meta: Frontmatter, to: Status, facts: MoveFacts): Change {
  const from = meta.status;
  if (!TRANSITIONS[from].includes(to))
    throw new TransitionError(
      `${meta.id}: ${from} → ${to} is not allowed. From ${from}: ${TRANSITIONS[from].join(", ") || "nothing (final)"}.`,
    );
  const change: Change = { status: to, updated: facts.today };
  requireOwner(meta, facts);

  if (to === "cancelled" || to === "blocked") {
    if (!facts.reason?.trim())
      throw new TransitionError(`Moving ${meta.id} to ${to} needs --reason.`);
    change.reason = facts.reason.trim();
    if (to === "blocked") change.resume_to = from as ActiveStatus;
    return change;
  }

  if (from === "blocked") {
    if (to !== meta.resume_to)
      throw new TransitionError(
        `${meta.id} was blocked from ${meta.resume_to}; it can only return there.`,
      );
    change.reason = "";
    change.resume_to = "";
  }

  if (to === "in_progress") {
    if (!meta.owner) throw new TransitionError(`Claim ${meta.id} first: pnpm t:claim ${meta.id}.`);
    const open = unfinished(meta, facts);
    if (open.length)
      throw new TransitionError(`${meta.id} is still blocked by ${open.join(", ")}.`);
    if (from === "in_review" && !facts.reason?.trim())
      throw new TransitionError("Returning to in_progress needs --reason (the requested changes).");
    if (facts.branch !== undefined && !facts.branch.includes(meta.id))
      throw new TransitionError(
        `Run this in ${meta.id}'s worktree (branch ${meta.branch || "containing " + meta.id}), not on ${facts.branch}.`,
      );
    if (!meta.started) change.started = facts.today;
  }

  if (to === "in_review") {
    if (facts.branch !== undefined && !facts.branch.includes(meta.id))
      throw new TransitionError(`Run this on ${meta.id}'s branch, not ${facts.branch}.`);
    if (!facts.criteriaTicked)
      throw new TransitionError(`Tick every acceptance criterion in ${meta.id} before review.`);
    if (!facts.clean)
      throw new TransitionError("Commit all work first; the working tree is not clean.");
    if (!facts.verified) throw new TransitionError("pnpm verify must pass before review.");
    if (!facts.pushed)
      throw new TransitionError("Push the branch first (git push -u origin HEAD).");
    if (!facts.openPr) throw new TransitionError("Open the PR first (pnpm t:pr does all of this).");
    change.pr = facts.openPr;
  }

  if (to === "done") {
    if (!facts.mergedPr) throw new TransitionError(`${meta.id}'s PR is not merged yet.`);
    if (!facts.criteriaTicked)
      throw new TransitionError(`${meta.id} has unticked acceptance criteria on main.`);
    change.pr = facts.mergedPr;
    change.completed = facts.today;
  }

  return change;
}

export function logLine(
  today: string,
  from: Status | "new",
  to: Status | "claimed" | "released",
  actor: string,
  agent: string,
  reason?: string,
): string {
  const who = agent ? `${actor} (${agent})` : actor;
  return `- ${today} — ${from} → ${to} — ${who}${reason ? ` — ${reason.replace(/\s+/g, " ")}` : ""}`;
}

export const isActive = (s: Status): s is ActiveStatus =>
  (ACTIVE_STATUSES as readonly string[]).includes(s);
