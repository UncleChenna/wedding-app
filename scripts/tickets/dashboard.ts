import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { Ticket } from "./model";
import { EPICS, STATUSES } from "./model";
import { statusLabel } from "./render";
import ivory from "../../src/modules/theming/themes/ivory-gold.json" with { type: "json" };
import dark from "../../src/modules/theming/themes/midnight-champagne.json" with { type: "json" };

/** JSON embedded in HTML must never be able to terminate its script element. */
export function safeJson(value: unknown): string {
  return JSON.stringify(value)
    .replaceAll("<", "\\u003c")
    .replaceAll("\u2028", "\\u2028")
    .replaceAll("\u2029", "\\u2029");
}
export function dashboardHtml(
  tickets: readonly Ticket[],
  source: string,
  base: string,
  live = false,
): string {
  const asset = (name: string) =>
    readFileSync(fileURLToPath(new URL(`./dashboard/${name}`, import.meta.url)), "utf8");
  const initialTokens = Object.entries(ivory.colors)
    .map(([name, value]) => `--${name}:${value}`)
    .join(";");
  const data = {
    tickets,
    live,
    source,
    base,
    generated: new Date().toISOString(),
    epics: EPICS,
    statuses: STATUSES.map((id) => ({ id, name: statusLabel(id) })),
    themes: [ivory, dark],
  };
  const footer = live
    ? "Updates automatically: local files are watched and the shared ledger is checked every 20 seconds. Ticket definitions come from this checkout; pull changes to see newly merged definitions. Read-only; use the CLI to change status."
    : "Read-only snapshot. Run pnpm t:dashboard:snapshot again, then reload to refresh. Use the CLI to change status.";
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light dark"><title>Wedding · Project board</title><style>:root{${initialTokens}}${asset("board.css")}</style></head><body>
<header><div class="eyebrow">WEDDING / PROJECT WORKSPACE</div><div class="heading"><div><h1>A little closer<br>to the celebration.</h1><p>One place for the work ahead.</p></div><label>Appearance<select id="theme"></select></label></div><p id="freshness" class="meta" role="status" aria-live="polite"></p></header>
<main><section aria-label="Project progress" class="summary" id="summary"></section>
<section aria-label="Filter tickets" class="filters"><label class="search">Find a ticket<input id="search" type="search" placeholder="Search title, ID or details"></label><label>Epic<select id="epic"><option value="">All epics</option></select></label><label>Owner<select id="owner"><option value="">Everyone</option><option value="unassigned">Unassigned</option></select></label><label>Priority<select id="priority"><option value="">All priorities</option></select></label><label>Label<select id="label"><option value="">All labels</option></select></label><button id="reset" type="button">Clear filters</button></section>
<div class="board-heading"><h2>The work, at a glance</h2><p id="results" role="status" aria-live="polite"></p></div><p id="empty" hidden>No tickets match. Try another search or clear the filters.</p><section id="board" class="board" aria-label="Ticket board"></section>
<details class="epics"><summary>Progress by epic</summary><div id="epics"></div></details>
<footer>${footer}</footer></main>
<dialog aria-labelledby="detail-title" id="detail"><div class="dialog-top"><span id="detail-id" class="eyebrow"></span><button id="close" type="button" aria-label="Close ticket details">Close</button></div><h2 id="detail-title"></h2><div id="detail-body"></div></dialog>
<script type="application/json" id="board-data">${safeJson(data)}</script><script>${asset("board.js")}</script></body></html>`;
}
