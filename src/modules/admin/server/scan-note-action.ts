"use server";
import "server-only";
import { revalidatePath } from "next/cache";
import { recordScanNote, type ScanNoteResult } from "./scan-log-service";
import { scanLogPorts } from "./scan-log";

export async function saveScanNoteAction(
  _previous: ScanNoteResult,
  form: FormData,
): Promise<ScanNoteResult> {
  const result = await recordScanNote(
    {
      eventId: form.get("eventId"),
      requestId: form.get("requestId"),
      resolution: form.get("resolution"),
    },
    scanLogPorts,
  );
  if (result.ok) revalidatePath("/admin/scans");
  return result;
}
