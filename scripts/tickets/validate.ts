import { activity, criteria } from "./format";
import { byId, findCycle, inverseBlocks } from "./graph";
import { MILESTONES, formatId, idNumber } from "./model";
import type { Ticket } from "./model";

/** Text from tickets/TEMPLATE.md that must be replaced before a ticket is valid. */
const TEMPLATE_PLACEHOLDERS = [
  "Short imperative title",
  "- What is in.",
  "- What is deliberately not in",
  "A testable statement a reviewer can check",
  "- Unit: …",
  "`src/modules/…`",
];

/**
 * Whole-backlog checks. Returns human-readable problems; empty means valid.
 * Parse errors (schema, sections, heading) are reported by the loader.
 */
export function validateTickets(tickets: readonly Ticket[]): string[] {
  const problems: string[] = [];
  const add = (t: Ticket | null, message: string) =>
    problems.push(t ? `${t.meta.id}: ${message}` : message);
  const map = byId(tickets.map((t) => t.meta));

  const seen = new Map<string, string>();
  for (const t of tickets) {
    const previous = seen.get(t.meta.id);
    if (previous) add(t, `duplicate id (also ${previous})`);
    seen.set(t.meta.id, t.path);
    // The slug is fixed at creation (titles may be reworded later), but it must be a slug.
    if (!new RegExp(`^tickets/${t.meta.id}-[a-z0-9]+(-[a-z0-9]+)*\\.md$`).test(t.path))
      add(t, `file must be named tickets/${t.meta.id}-<slug>.md (found ${t.path})`);
  }

  // Ids are allocated sequentially and never reused or deleted (cancel instead).
  const max = Math.max(0, ...tickets.map((t) => idNumber(t.meta.id)));
  const missing = Array.from({ length: max }, (_, i) => formatId(i + 1)).filter(
    (id) => !map.has(id),
  );
  if (missing.length)
    problems.push(
      `ids must be contiguous from WED-001; missing ${missing.join(", ")} (cancel tickets, never delete them)`,
    );

  const inverse = inverseBlocks(tickets.map((t) => t.meta));
  for (const t of tickets) {
    const m = t.meta;
    for (const dep of m.blocked_by) {
      if (!map.has(dep)) add(t, `blocked_by ${dep} does not exist`);
      if (dep === m.id) add(t, "cannot block itself");
    }
    for (const dep of m.blocks) if (!map.has(dep)) add(t, `blocks ${dep} does not exist`);
    const expected = inverse.get(m.id) ?? [];
    if (expected.join(",") !== m.blocks.join(","))
      add(
        t,
        `blocks must be [${expected.join(", ")}] (the inverse of blocked_by); run pnpm t:render`,
      );
    if (new Set(m.blocked_by).size !== m.blocked_by.length) add(t, "duplicate blocked_by entries");
    if (new Set(m.labels).size !== m.labels.length) add(t, "duplicate labels");

    for (const marker of TEMPLATE_PLACEHOLDERS)
      if (Object.values(t.sections).some((s) => s.includes(marker)) || m.title.includes(marker))
        add(t, `still contains template placeholder text ("${marker}"); fill in every section`);
    const ticks = criteria(t);
    const lines = t.sections["Acceptance criteria"].split("\n").filter((l) => l.trim());
    if (!ticks.length) add(t, "acceptance criteria need at least one '- [ ] testable statement'");
    if (lines.length !== ticks.length)
      add(t, "every acceptance criteria line must be a '- [ ]' checkbox");
    if (!/\.\.\/docs\/prd\.md|PRD|docs\//.test(t.sections.Context))
      add(t, "context must link the relevant PRD section or doc");
    if (!/unit|e2e|end-to-end|manual|playwright|vitest|check/i.test(t.sections["Test plan"]))
      add(t, "test plan must name unit, end-to-end or manual checks");
    const log = activity(t);
    if (!log.length) add(t, "activity log needs at least one dated line");
    for (const line of log)
      if (!/^- \d{4}-\d{2}-\d{2} — /.test(line))
        add(t, `activity line must start "- YYYY-MM-DD — ": ${line}`);

    if (m.updated < m.created) add(t, "updated is before created");
    const needsOwner = ["in_progress", "in_review", "done"].includes(m.status);
    if (needsOwner && (!m.owner || !m.agent)) add(t, `${m.status} tickets need owner and agent`);
    if (m.status === "backlog" && m.owner) add(t, "backlog tickets cannot be claimed");
    if (m.branch && !m.branch.includes(m.id)) add(t, `branch ${m.branch} must contain ${m.id}`);
    if (needsOwner && !m.branch) add(t, `${m.status} tickets need a branch`);
    if (needsOwner && !m.started) add(t, `${m.status} tickets need a started date`);
    if (["in_review", "done"].includes(m.status)) {
      if (!m.pr) add(t, `${m.status} tickets need a PR link`);
      if (ticks.some((c) => !c.checked))
        add(t, `${m.status} tickets need every acceptance criterion ticked`);
    }
    if (m.status === "done" && !m.completed) add(t, "done tickets need a completed date");
    if (m.status !== "done" && m.completed) add(t, "only done tickets have a completed date");
    if (m.status === "in_progress" || m.status === "in_review")
      for (const dep of m.blocked_by)
        if (map.get(dep) && map.get(dep)?.status !== "done")
          add(t, `${m.status} while blocker ${dep} is ${map.get(dep)?.status}`);
    if (m.status === "blocked" && (!m.reason || !m.resume_to))
      add(t, "blocked tickets need reason and resume_to");
    if (m.status === "cancelled" && !m.reason) add(t, "cancelled tickets need a reason");
    if (!["blocked", "cancelled"].includes(m.status) && (m.reason || m.resume_to))
      add(t, "reason/resume_to are only set while blocked or cancelled");
  }

  const cycle = findCycle(tickets.map((t) => t.meta));
  if (cycle) problems.push(`dependency cycle: ${cycle.join(" → ")}`);
  for (const milestone of MILESTONES)
    if (tickets.length && !map.has(milestone.id))
      problems.push(`milestone ${milestone.id} (${milestone.name}) does not exist`);
  return problems;
}
