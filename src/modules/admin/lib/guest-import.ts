import { z } from "zod";
import { invitationEditorSchema } from "./invitation-editor";
import { spreadsheetCell } from "./guest-export";

export function guestImportErrorsCsv(errors: ImportError[]): string {
  return (
    [["Row", "Column", "Message"], ...errors.map((e) => [e.row, e.column, e.message])]
      .map((row) => row.map(spreadsheetCell).join(","))
      .join("\r\n") + "\r\n"
  );
}

export interface ImportError {
  row: number;
  column: string;
  message: string;
}
export interface ImportParty {
  side: string | null;
  tableNumber: number | null;
  maxTagAlongs: number;
  rows: number[];
  members: { name: string; email: string | null; phone: string | null }[];
}
export type ImportParseResult =
  { ok: true; parties: ImportParty[] } | { ok: false; errors: ImportError[] };
export interface ImportPreview {
  id: string;
  digest: string;
  expiresAt: string;
  parties: ImportParty[];
  counts: { invitations: number; guests: number };
}
export type ImportPreviewResult =
  | { status: "preview"; preview: ImportPreview }
  | { status: "error"; message: string; errors: ImportError[] };
export type ImportCommitResult =
  | { status: "committed"; invitationIds: string[]; count: number; replayed: boolean }
  | { status: "error"; message: string };
export const importCommitSchema = z.strictObject({
  previewId: z.uuid(),
  digest: z.string().regex(/^[a-f0-9]{64}$/),
});

const required = ["name", "phone", "email", "party size", "side", "table"];
/** RFC-style quoted fields. Row numbers are logical records, including header as row 1. */
function records(csv: string): string[][] | null {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  let closed = false;
  for (let i = 0; i < csv.length; i++) {
    const c = csv[i];
    if (quoted) {
      if (c === '"') {
        if (csv[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          quoted = false;
          closed = true;
        }
      } else cell += c;
      continue;
    }
    if (c === '"') {
      if (cell || closed) return null;
      quoted = true;
      continue;
    }
    if (c === "," || c === "\r" || c === "\n") {
      row.push(cell);
      cell = "";
      closed = false;
      if (c !== ",") {
        rows.push(row);
        row = [];
        if (c === "\r" && csv[i + 1] === "\n") i++;
      }
    } else {
      if (closed) return null;
      cell += c;
    }
    if (rows.length > 301) return null;
  }
  if (quoted) return null;
  if (row.length || cell || closed) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

export function parseGuestImportCsv(input: unknown): ImportParseResult {
  const fail = (message: string): ImportParseResult => ({
    ok: false,
    errors: [{ row: 1, column: "file", message }],
  });
  if (typeof input !== "string" || new TextEncoder().encode(input).length > 262144)
    return fail("Choose a CSV file no larger than 256 KB.");
  const parsed = records(input.replace(/^\uFEFF/, ""));
  if (!parsed || parsed.length < 2 || parsed.length > 301)
    return fail("Use valid CSV with between 1 and 300 guest rows.");
  const headers = (parsed[0] ?? []).map((s) => s.trim().toLowerCase());
  if (headers.includes("household"))
    return fail(
      "Remove the obsolete household column. Use one row per invited guest; party size includes that guest and their plus-ones.",
    );
  if (
    new Set(headers).size !== headers.length ||
    required.some((h) => !headers.includes(h)) ||
    headers.some((h) => !required.includes(h))
  )
    return fail(
      "Use name, phone, email, party size, side and table headers. Each row creates one invitation.",
    );
  const errors: ImportError[] = [];
  const groups = new Map<string, { party: ImportParty; partySize: number }>();
  parsed.slice(1).forEach((cells, index) => {
    const row = index + 2;
    const issue = (column: string, message: string) => errors.push({ row, column, message });
    if (cells.length !== headers.length) {
      issue("row", "This row has a different number of columns.");
      return;
    }
    const values = Object.fromEntries(headers.map((h, i) => [h, (cells[i] ?? "").trim()]));
    if (
      !/^\d{1,3}$/.test(values["party size"] ?? "") ||
      Number(values["party size"]) < 1 ||
      Number(values["party size"]) > 300
    ) {
      issue("party size", "Enter a whole party size from 1 to 300.");
      return;
    }
    if (
      values.table &&
      (!/^\d{1,10}$/.test(values.table) ||
        Number(values.table) < 1 ||
        Number(values.table) > 2147483647)
    ) {
      issue("table", "Enter an existing positive table number or leave it empty.");
      return;
    }
    const result = invitationEditorSchema.safeParse({
      side: values.side,
      tableId: "",
      maxTagAlongs: "0",
      members: [{ id: "", name: values.name, email: values.email, phone: values.phone }],
    });
    if (!result.success) {
      for (const e of result.error.issues) issue(String(e.path.at(-1) ?? "row"), e.message);
      return;
    }
    const data = result.data;
    const member = data.members[0];
    if (!member) {
      issue("name", "Enter a guest name.");
      return;
    }
    const tableNumber = values.table ? Number(values.table) : null;
    const { name, email, phone } = member;
    groups.set(`row:${row}`, {
      partySize: Number(values["party size"]),
      party: {
        side: data.side,
        tableNumber,
        maxTagAlongs: 0,
        rows: [row],
        members: [{ name, email: email?.toLowerCase() ?? null, phone }],
      },
    });
  });
  const contacts = new Map<string, ImportParty>();
  const parties = [...groups.values()].map(({ party, partySize }) => {
    party.maxTagAlongs = partySize - party.members.length;
    if (party.maxTagAlongs < 0 || party.maxTagAlongs > 10)
      errors.push({
        row: party.rows[0] ?? 2,
        column: "party size",
        message:
          "Party size must include all named members and no more than 10 unnamed tag-alongs.",
      });
    for (const member of party.members)
      for (const value of [member.email, member.phone]) {
        if (!value) continue;
        const previous = contacts.get(value);
        if (previous && previous !== party)
          errors.push({
            row: party.rows[0] ?? 2,
            column: "contact",
            message:
              "This contact appears on separate invitations. Correct duplicate contacts before importing.",
          });
        contacts.set(value, party);
      }
    return party;
  });
  return errors.length ? { ok: false, errors } : { ok: true, parties };
}
