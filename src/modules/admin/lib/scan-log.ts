import { z } from "zod";

export const scanVerdicts = ["valid", "already_used", "invalid", "revoked", "not_rsvped"] as const;
export type ScanVerdict = (typeof scanVerdicts)[number];
export const scanVerdictLabels: Record<ScanVerdict, string> = {
  valid: "Valid",
  already_used: "Already used",
  invalid: "Invalid",
  revoked: "Revoked",
  not_rsvped: "Not RSVP’d",
};
export const scanResolutionNotes = {
  reviewed: "Reviewed — original evidence retained.",
  escalated: "Referred to the gate lead for review.",
  explained: "Discrepancy explained — original evidence retained.",
  follow_up: "Further follow-up needed.",
} as const;
export const scanNoteInput = z.strictObject({
  eventId: z.uuid(),
  requestId: z.uuid(),
  resolution: z.enum(["reviewed", "escalated", "explained", "follow_up"]),
});
export type ScanResolution = keyof typeof scanResolutionNotes;
export const scanPageSize = 25;
export interface ScanLogFilters {
  page: number;
  invitation?: string;
  staff?: string;
  device?: string;
  result?: ScanVerdict;
  source?: "online" | "offline" | "legacy";
  conflict?: boolean;
  from?: string;
  to?: string;
}
const utcMinute = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)
  .refine((value) => {
    const date = new Date(`${value}:00.000Z`);
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 16) === value;
  })
  .transform((value) => new Date(`${value}:00.000Z`).toISOString());
const filterInput = z
  .object({
    page: z
      .string()
      .regex(/^[1-9]\d*$/)
      .transform(Number)
      .pipe(z.number().int().max(10000))
      .optional(),
    invitation: z.union([z.uuid(), z.literal("unknown")]).optional(),
    staff: z.uuid().optional(),
    device: z
      .string()
      .min(1)
      .max(256)
      .regex(/^[^\p{Cc}\p{Cf}]+$/u)
      .optional(),
    result: z.enum(scanVerdicts).optional(),
    source: z.enum(["online", "offline", "legacy"]).optional(),
    conflict: z
      .enum(["yes", "no"])
      .transform((value) => value === "yes")
      .optional(),
    from: utcMinute.optional(),
    to: utcMinute.optional(),
  })
  .refine((value) => !value.from || !value.to || value.from <= value.to);

export function parseScanLogFilters(
  input: Record<string, string | string[] | undefined>,
): { ok: true; filters: ScanLogFilters } | { ok: false; message: string } {
  const parsed = filterInput.safeParse(
    Object.fromEntries(
      Object.entries(input).filter(([, value]) => value !== "" && value !== undefined),
    ),
  );
  return parsed.success
    ? { ok: true, filters: { ...parsed.data, page: parsed.data.page ?? 1 } }
    : { ok: false, message: "Check the filters and enter a valid time range in UTC." };
}

export interface ScanLogNote {
  id: string;
  recordedAt: string;
  resolution: ScanResolution;
}
export interface ScanLogEntry {
  id: string;
  invitationId: string | null;
  invitationName: string | null;
  staffId: string | null;
  staffName: string | null;
  deviceId: string | null;
  deviceName: string | null;
  reportedAt: string;
  receivedAt: string;
  reportedResult: ScanVerdict;
  result: ScanVerdict;
  reportedPeople: number;
  admittedPeople: number;
  conflict: boolean;
  source: "online" | "offline" | "legacy";
  inputMethod: "qr" | "manual" | null;
  notes: ScanLogNote[];
}
export interface ScanLogOptions {
  invitations: { id: string; name: string }[];
  staff: { id: string; name: string }[];
  devices: { id: string; name: string }[];
}
export function scanLogSearch(filters: ScanLogFilters): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined) continue;
    params.set(
      key,
      typeof value === "boolean"
        ? value
          ? "yes"
          : "no"
        : key === "from" || key === "to"
          ? String(value).slice(0, 16)
          : String(value),
    );
  }
  return params.toString();
}
