import { FIELD_ORDER, SECTIONS, frontmatterSchema } from "./model";
import type { Frontmatter, SectionName, Ticket } from "./model";

/**
 * Ticket files are Markdown with a deliberately tiny YAML frontmatter subset:
 * `key: scalar`, `key: "json string"` and `key: [a, b]`. The CLI writes them;
 * a strict parser keeps the format round-trippable and diff-friendly.
 */

export class TicketFormatError extends Error {
  override name = "TicketFormatError";
}

const SIMPLE = /^[A-Za-z0-9][A-Za-z0-9 _./:@()&,'+-]*$/;

function scalar(value: string): string {
  if (value === "") return '""';
  // Quote anything YAML could misread (colons followed by space, leading symbols, trailing spaces).
  if (SIMPLE.test(value) && !/: |\s$|^(true|false|null|yes|no)$/i.test(value)) return value;
  return JSON.stringify(value);
}

export function serializeFrontmatter(meta: Frontmatter): string {
  const lines = FIELD_ORDER.map((key) => {
    const value = meta[key];
    if (Array.isArray(value)) return `${key}: [${value.join(", ")}]`;
    return `${key}: ${scalar(String(value))}`;
  });
  return `---\n${lines.join("\n")}\n---\n`;
}

export function parseFrontmatter(block: string, path: string): Frontmatter {
  const raw: Record<string, unknown> = {};
  for (const [n, line] of block.split("\n").entries()) {
    if (!line.trim()) continue;
    const match = /^([a-z_]+): ?(.*)$/.exec(line);
    if (!match)
      throw new TicketFormatError(`${path}: frontmatter line ${n + 1} is not "key: value"`);
    const [, key = "", value = ""] = match;
    if (key in raw) throw new TicketFormatError(`${path}: duplicate frontmatter key "${key}"`);
    if (value.startsWith("[")) {
      if (!value.endsWith("]"))
        throw new TicketFormatError(`${path}: list "${key}" must be on one line`);
      raw[key] = value
        .slice(1, -1)
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);
    } else if (value.startsWith('"')) {
      try {
        raw[key] = JSON.parse(value);
      } catch {
        throw new TicketFormatError(`${path}: "${key}" has an invalid quoted string`);
      }
    } else raw[key] = value;
  }
  const result = frontmatterSchema.safeParse(raw);
  if (!result.success)
    throw new TicketFormatError(
      `${path}: ${result.error.issues.map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`).join("; ")}`,
    );
  return result.data;
}

export function parseTicket(text: string, path: string): Ticket {
  const match = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(text);
  if (!match) throw new TicketFormatError(`${path}: missing --- frontmatter --- block`);
  const meta = parseFrontmatter(match[1] ?? "", path);
  const body = match[2] ?? "";
  const heading = /^\s*# (.+)\n/.exec(body);
  if (!heading || heading[1] !== `${meta.id}: ${meta.title}`)
    throw new TicketFormatError(`${path}: first heading must be "# ${meta.id}: ${meta.title}"`);
  const found = [...body.matchAll(/^## (.+)$/gm)];
  const names = found.map((m) => m[1]);
  const missing = SECTIONS.filter((s) => !names.includes(s));
  if (missing.length)
    throw new TicketFormatError(`${path}: missing sections: ${missing.join(", ")}`);
  const order = names.filter((n): n is SectionName =>
    (SECTIONS as readonly string[]).includes(n ?? ""),
  );
  if (order.join("|") !== SECTIONS.join("|") || names.length !== SECTIONS.length)
    throw new TicketFormatError(
      `${path}: sections must appear once each, in order: ${SECTIONS.join(", ")}`,
    );
  const sections = {} as Record<SectionName, string>;
  found.forEach((m, i) => {
    const start = (m.index ?? 0) + m[0].length;
    const end = found[i + 1]?.index ?? body.length;
    sections[m[1] as SectionName] = body.slice(start, end).trim();
  });
  return { meta, sections, path };
}

export function serializeTicket(ticket: Ticket): string {
  const body = SECTIONS.map(
    (name) => `## ${name}\n\n${ticket.sections[name].trim() || "_None._"}\n`,
  ).join("\n");
  return `${serializeFrontmatter(ticket.meta)}\n# ${ticket.meta.id}: ${ticket.meta.title}\n\n${body}`;
}

export interface Criterion {
  checked: boolean;
  text: string;
}
export function criteria(ticket: Ticket): Criterion[] {
  return ticket.sections["Acceptance criteria"]
    .split("\n")
    .map((line) => /^- \[( |x|X)\] (.+)$/.exec(line.trim()))
    .filter((m): m is RegExpExecArray => m !== null)
    .map((m) => ({ checked: m[1] !== " ", text: m[2] ?? "" }));
}
export function activity(ticket: Ticket): string[] {
  return ticket.sections["Activity log"]
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.startsWith("- "));
}
