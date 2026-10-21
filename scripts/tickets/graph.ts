import { ESTIMATE_POINTS, PRIORITIES, idNumber } from "./model";
import type { Frontmatter, Status } from "./model";

type Meta = Pick<
  Frontmatter,
  "id" | "blocked_by" | "estimate" | "priority" | "status" | "owner" | "labels"
>;

const CLOSED: readonly Status[] = ["done", "cancelled"];
export const isClosed = (m: Pick<Meta, "status">) => CLOSED.includes(m.status);

export function byId<T extends { id: string }>(items: readonly T[]): Map<string, T> {
  return new Map(items.map((i) => [i.id, i]));
}

/** Returns one cycle (as ids, first repeated at the end) or null. */
export function findCycle(metas: readonly Meta[]): string[] | null {
  const map = byId(metas);
  const state = new Map<string, "visiting" | "done">();
  const stack: string[] = [];
  const visit = (id: string): string[] | null => {
    if (state.get(id) === "done") return null;
    if (state.get(id) === "visiting") return [...stack.slice(stack.indexOf(id)), id];
    state.set(id, "visiting");
    stack.push(id);
    for (const dep of map.get(id)?.blocked_by ?? []) {
      if (!map.has(dep)) continue;
      const cycle = visit(dep);
      if (cycle) return cycle;
    }
    stack.pop();
    state.set(id, "done");
    return null;
  };
  for (const m of [...metas].sort((a, b) => idNumber(a.id) - idNumber(b.id))) {
    const cycle = visit(m.id);
    if (cycle) return cycle;
  }
  return null;
}

/** `blocks` is always the inverse of every other ticket's `blocked_by`, sorted by id. */
export function inverseBlocks(metas: readonly Meta[]): Map<string, string[]> {
  const result = new Map<string, string[]>(metas.map((m) => [m.id, []]));
  for (const m of metas) for (const dep of m.blocked_by) result.get(dep)?.push(m.id);
  for (const list of result.values()) list.sort((a, b) => idNumber(a) - idNumber(b));
  return result;
}

const weight = (m: Meta) => (isClosed(m) ? 0 : ESTIMATE_POINTS[m.estimate]);

/**
 * Longest remaining weighted chain that ends at each ticket (inclusive), over
 * open tickets only. Requires an acyclic graph.
 */
function chainsTo(metas: readonly Meta[]): Map<string, { points: number; path: string[] }> {
  const map = byId(metas);
  const memo = new Map<string, { points: number; path: string[] }>();
  const visit = (id: string): { points: number; path: string[] } => {
    const cached = memo.get(id);
    if (cached) return cached;
    const m = map.get(id);
    if (!m || isClosed(m)) {
      const empty = { points: 0, path: [] };
      memo.set(id, empty);
      return empty;
    }
    let best = { points: 0, path: [] as string[] };
    for (const dep of m.blocked_by) {
      const chain = visit(dep);
      if (
        chain.points > best.points ||
        (chain.points === best.points && chain.path.length > best.path.length)
      )
        best = chain;
    }
    const result = { points: best.points + weight(m), path: [...best.path, id] };
    memo.set(id, result);
    return result;
  };
  for (const m of metas) visit(m.id);
  return memo;
}

/** Critical path to a target ticket, or the longest open chain overall when no target is given. */
export function criticalPath(
  metas: readonly Meta[],
  target?: string,
): { points: number; path: string[] } {
  const chains = chainsTo(metas);
  if (target) return chains.get(target) ?? { points: 0, path: [] };
  let best = { points: 0, path: [] as string[] };
  for (const chain of chains.values()) if (chain.points > best.points) best = chain;
  return best;
}

/** Points of the longest open chain that starts at each ticket: how much work it unblocks. */
export function downstreamPoints(metas: readonly Meta[]): Map<string, number> {
  const dependants = inverseBlocks(metas);
  const map = byId(metas);
  const memo = new Map<string, number>();
  const visit = (id: string): number => {
    const cached = memo.get(id);
    if (cached !== undefined) return cached;
    const m = map.get(id);
    const own = m ? weight(m) : 0;
    const rest = Math.max(0, ...(dependants.get(id) ?? []).map(visit));
    memo.set(id, own + rest);
    return own + rest;
  };
  for (const m of metas) visit(m.id);
  return memo;
}

/** Sort order for picking work: priority, then work unblocked, then lowest id. */
export function pickOrder(metas: readonly Meta[]): (a: Meta, b: Meta) => number {
  const downstream = downstreamPoints(metas);
  return (a, b) =>
    PRIORITIES.indexOf(a.priority) - PRIORITIES.indexOf(b.priority) ||
    (downstream.get(b.id) ?? 0) - (downstream.get(a.id) ?? 0) ||
    idNumber(a.id) - idNumber(b.id);
}

export interface PickOptions {
  module?: string;
  includeHuman?: boolean;
  onlyHuman?: boolean;
}
const matches = (m: Meta & { module?: string }, o: PickOptions) =>
  (!o.module || m.module === o.module) &&
  (o.onlyHuman ? m.labels.includes("human") : o.includeHuman || !m.labels.includes("human"));

/** Ready = todo, unclaimed, every blocker done. */
export function ready<T extends Meta & { module?: string }>(
  metas: readonly T[],
  options: PickOptions = {},
): T[] {
  const map = byId(metas);
  return metas
    .filter(
      (m) =>
        m.status === "todo" &&
        !m.owner &&
        matches(m, options) &&
        m.blocked_by.every((d) => map.get(d)?.status === "done"),
    )
    .sort(pickOrder(metas));
}

/**
 * Simulated pick order: assume in-flight work (and anything `skip` matches,
 * e.g. human tasks done in parallel) finishes, then repeatedly take the best
 * ready ticket. Used for the "next 10" list.
 */
export function upcoming<T extends Meta>(
  metas: readonly T[],
  count: number,
  options: { skip?: (m: T) => boolean } = {},
): T[] {
  const map = byId(metas);
  const skip = options.skip ?? (() => false);
  const finished = new Set(
    metas
      .filter((m) => ["done", "in_progress", "in_review"].includes(m.status) || skip(m))
      .map((m) => m.id),
  );
  const order = pickOrder(metas);
  const result: T[] = [];
  const pool = metas.filter((m) => m.status === "todo" && !skip(m));
  while (result.length < count) {
    const candidates = pool
      .filter((m) => !finished.has(m.id))
      .filter((m) =>
        m.blocked_by.every((d) => finished.has(d) || map.get(d)?.status === "cancelled"),
      )
      .sort(order);
    const next = candidates[0];
    if (!next) break;
    result.push(next);
    finished.add(next.id);
  }
  return result;
}

export const isHuman = (m: Pick<Meta, "labels">) => m.labels.includes("human");
