import "server-only";
import { unstable_rethrow } from "next/navigation";
import {
  parseScanLogFilters,
  scanNoteInput,
  type ScanLogEntry,
  type ScanLogFilters,
  type ScanLogOptions,
  type ScanResolution,
} from "../lib/scan-log";
import type { AdminAccess } from "./admin-access";

export interface ScanLogPage {
  entries: ScanLogEntry[];
  hasMore: boolean;
  options: ScanLogOptions;
}
export interface ScanLogPorts {
  access(): Promise<AdminAccess>;
  read(filters: ScanLogFilters): Promise<ScanLogPage>;
  append(input: {
    eventId: string;
    requestId: string;
    resolution: ScanResolution;
    adminId: string;
  }): Promise<{ status: "saved" | "not-found" | "conflict" }>;
  warn(message: string): void;
}
export type ScanLogResult =
  | ({ status: "ready"; filters: ScanLogFilters } & ScanLogPage)
  | { status: "denied" }
  | { status: "invalid" | "error"; message: string };
export type ScanNoteResult = { ok: boolean; message: string; uncertain?: true };

export async function readScanLog(
  input: Record<string, string | string[] | undefined>,
  ports: ScanLogPorts,
): Promise<ScanLogResult> {
  try {
    if ((await ports.access()).status !== "ready") return { status: "denied" };
    const parsed = parseScanLogFilters(input);
    if (!parsed.ok) return { status: "invalid", message: parsed.message };
    return { status: "ready", filters: parsed.filters, ...(await ports.read(parsed.filters)) };
  } catch (error) {
    unstable_rethrow(error);
    ports.warn("Scan log unavailable");
    return { status: "error", message: "The scan log couldn't load. Please try again." };
  }
}
export async function recordScanNote(input: unknown, ports: ScanLogPorts): Promise<ScanNoteResult> {
  try {
    const actor = await ports.access();
    if (actor.status !== "ready")
      return { ok: false, message: "Please complete two-step sign-in first." };
    const parsed = scanNoteInput.safeParse(input);
    if (!parsed.success) return { ok: false, message: "Choose a resolution note and try again." };
    const result = await ports.append({ ...parsed.data, adminId: actor.userId });
    if (result.status === "not-found")
      return { ok: false, message: "This scan could not be found. Refresh the log." };
    if (result.status === "conflict")
      return {
        ok: false,
        message: "This request was already used for another note. Refresh the log.",
      };
    return { ok: true, message: "Note saved. Original scan evidence is unchanged." };
  } catch (error) {
    unstable_rethrow(error);
    ports.warn("Scan note unavailable");
    return {
      ok: false,
      uncertain: true,
      message: "We couldn't confirm your note was saved. Please try again.",
    };
  }
}
