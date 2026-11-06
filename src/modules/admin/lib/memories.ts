import { z } from "zod";

const count = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
const memoriesSchema = z.object({
  invitations: count,
  repliedYes: count,
  repliedNo: count,
  attending: count,
  admissions: count,
  menu: z.array(z.object({ name: z.string().min(1).max(200), ordered: count, served: count })),
});
export type Memories = z.infer<typeof memoriesSchema>;

/** Allowlist projection: never serialize query rows or extra personal fields directly. */
export function parseMemories(input: unknown): Memories {
  return memoriesSchema.parse(input);
}

function csvCell(value: string | number): string {
  let text = String(value);
  if (typeof value === "string" && (/^\s*[=+\-@]/.test(text) || /^[\t\r]/.test(text)))
    text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

export function memoriesCsv(input: unknown): string {
  const data = parseMemories(input);
  const rows: (string | number)[][] = [
    ["Category", "Label", "Count", "Served"],
    ["Invitations", "Households", data.invitations, ""],
    ["RSVP", "Yes", data.repliedYes, ""],
    ["RSVP", "No", data.repliedNo, ""],
    ["Attendance", "Expected guests", data.attending, ""],
    ["Attendance", "Recorded admissions", data.admissions, ""],
    ...data.menu.map((item) => ["Menu", item.name, item.ordered, item.served]),
  ];
  return rows.map((row) => row.map(csvCell).join(",")).join("\r\n") + "\r\n";
}
