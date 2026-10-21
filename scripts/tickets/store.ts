import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import { activity, parseTicket, serializeTicket } from "./format";
import { inverseBlocks } from "./graph";
import { LEDGER_FIELDS, ledgerKey } from "./model";
import type { LedgerData, LedgerRecord, Ticket } from "./model";
import { renderBoard, renderRoadmap } from "./render";

export const TICKET_FILE = /^TICKET-\d{3}-[a-z0-9-]+\.md$/;
export const GENERATED = ["tickets/BOARD.md", "tickets/ROADMAP.md"] as const;

export function loadTickets(root: string): Ticket[] {
  const dir = join(root, "tickets");
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => TICKET_FILE.test(f) && !f.startsWith("TICKET-000"))
    .sort()
    .map((f) => parseTicket(readFileSync(join(dir, f), "utf8"), `tickets/${f}`));
}

/** Like loadTickets, but collects parse errors instead of throwing on the first. */
export function loadTicketsSafely(root: string): { tickets: Ticket[]; errors: string[] } {
  const dir = join(root, "tickets");
  const tickets: Ticket[] = [];
  const errors: string[] = [];
  if (!existsSync(dir)) return { tickets, errors: ["tickets/ does not exist"] };
  for (const f of readdirSync(dir).sort()) {
    if (
      !f.endsWith(".md") ||
      f === "TEMPLATE.md" ||
      f === "AUDIT.md" ||
      GENERATED.includes(`tickets/${f}` as (typeof GENERATED)[number])
    )
      continue;
    if (!TICKET_FILE.test(f)) {
      errors.push(`tickets/${f}: ticket files are named TICKET-NNN-slug.md`);
      continue;
    }
    try {
      tickets.push(parseTicket(readFileSync(join(dir, f), "utf8"), `tickets/${f}`));
    } catch (error) {
      errors.push((error as Error).message);
    }
  }
  return { tickets, errors };
}

/** Effective ticket: committed file overlaid with live ledger state and log lines. */
export function overlay(ticket: Ticket, record: LedgerRecord | undefined): Ticket {
  if (!record) return ticket;
  const meta = { ...ticket.meta };
  for (const field of LEDGER_FIELDS) (meta as Record<string, unknown>)[field] = record[field];
  const lines = activity(ticket);
  const merged = [...lines, ...record.log.filter((l) => !lines.includes(l))];
  return { ...ticket, meta, sections: { ...ticket.sections, "Activity log": merged.join("\n") } };
}

export function effective(tickets: readonly Ticket[], ledger: LedgerData | null): Ticket[] {
  return deriveBlocks(tickets.map((t) => overlay(t, ledger?.tickets[ledgerKey(t.meta.id)])));
}

export function recordFrom(ticket: Ticket): LedgerRecord {
  const record = { log: [] as string[] } as unknown as LedgerRecord;
  for (const field of LEDGER_FIELDS)
    (record as unknown as Record<string, unknown>)[field] = ticket.meta[field];
  return record;
}

export function writeTicket(root: string, ticket: Ticket): void {
  writeFileSync(join(root, ticket.path), serializeTicket(ticket));
}

/** Reverse dependencies are a view, never a reason to rewrite another ticket. */
export function deriveBlocks(tickets: readonly Ticket[]): Ticket[] {
  const inverse = inverseBlocks(tickets.map((t) => t.meta));
  return tickets.map((t) => ({ ...t, meta: { ...t.meta, blocks: inverse.get(t.meta.id) ?? [] } }));
}

export function renderOutputs(tickets: readonly Ticket[]): {
  tickets: Ticket[];
  files: Record<string, string>;
} {
  const fixed = deriveBlocks(tickets);
  const metas = fixed.map((t) => t.meta);
  const paths = new Map(fixed.map((t) => [t.meta.id, `../../${t.path}`]));
  return {
    tickets: fixed,
    files: {
      "artifacts/tickets/BOARD.md": renderBoard(metas, paths) + "\n",
      "artifacts/tickets/ROADMAP.md": renderRoadmap(metas, paths) + "\n",
    },
  };
}

/** Local snapshots only; never write or stage tracked ticket files. */
export function render(root: string, tickets: readonly Ticket[] = loadTickets(root)): string[] {
  const { files } = renderOutputs(tickets);
  const changed: string[] = [];
  for (const [path, content] of Object.entries(files)) {
    const full = join(root, path);
    mkdirSync(dirname(full), { recursive: true });
    if (!existsSync(full) || readFileSync(full, "utf8") !== content) {
      writeFileSync(full, content);
      changed.push(path);
    }
  }
  return changed;
}
