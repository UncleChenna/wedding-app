import "server-only";
import { and, asc, desc, eq, gte, inArray, isNull, lte, sql } from "drizzle-orm";
import type { Db } from "@/modules/shared/server/db/client";
import {
  invitations,
  registeredDevices,
  scanEvents,
  scanResolutionNotes,
  staff,
} from "@/modules/shared/server/db/schema";
import {
  scanPageSize,
  type ScanLogEntry,
  type ScanLogFilters,
  type ScanResolution,
} from "../lib/scan-log";
import type { ScanLogPage } from "./scan-log-service";

type Database = Pick<Db, "transaction" | "select" | "insert">;
/** Caller must authorize. Explicit projections never load PINs, pass tokens or dietary details. */
export async function readScanLogPage(
  database: Database,
  filters: ScanLogFilters,
): Promise<ScanLogPage> {
  return database.transaction(
    async (tx) => {
      const conditions = [
        filters.invitation === "unknown"
          ? isNull(scanEvents.invitationId)
          : filters.invitation
            ? eq(scanEvents.invitationId, filters.invitation)
            : undefined,
        filters.staff ? eq(scanEvents.staffId, filters.staff) : undefined,
        filters.device ? eq(scanEvents.deviceId, filters.device) : undefined,
        filters.result ? eq(scanEvents.result, filters.result) : undefined,
        filters.source ? eq(scanEvents.source, filters.source) : undefined,
        filters.conflict !== undefined ? eq(scanEvents.conflict, filters.conflict) : undefined,
        filters.from ? gte(scanEvents.receivedAt, new Date(filters.from)) : undefined,
        filters.to ? lte(scanEvents.receivedAt, new Date(filters.to)) : undefined,
      ];
      const rows = await tx
        .select({
          id: scanEvents.id,
          invitationId: scanEvents.invitationId,
          invitationName: invitations.householdName,
          staffId: scanEvents.staffId,
          staffName: staff.name,
          deviceId: scanEvents.deviceId,
          deviceName: registeredDevices.name,
          reportedAt: scanEvents.reportedAt,
          receivedAt: scanEvents.receivedAt,
          reportedResult: scanEvents.reportedResult,
          result: scanEvents.result,
          reportedPeople: scanEvents.reportedPeople,
          admittedPeople: scanEvents.admittedPeople,
          conflict: scanEvents.conflict,
          source: scanEvents.source,
          // TICKET-062 owns this additive column; integrate its schema before final verification.
          inputMethod: sql<"qr" | "manual" | null>`"scan_events"."input_method"`,
        })
        .from(scanEvents)
        .leftJoin(invitations, eq(invitations.id, scanEvents.invitationId))
        .leftJoin(staff, eq(staff.id, scanEvents.staffId))
        .leftJoin(registeredDevices, eq(registeredDevices.id, scanEvents.deviceId))
        .where(and(...conditions))
        .orderBy(desc(scanEvents.receivedAt), desc(scanEvents.id))
        .limit(scanPageSize + 1)
        .offset((filters.page - 1) * scanPageSize);
      const entries: ScanLogEntry[] = [];
      const pageRows = rows.slice(0, scanPageSize);
      const rankedNotes = tx
        .select({
          id: scanResolutionNotes.id,
          eventId: scanResolutionNotes.eventId,
          recordedAt: scanResolutionNotes.recordedAt,
          resolution: scanResolutionNotes.resolution,
          rank: sql<number>`row_number() over (partition by ${scanResolutionNotes.eventId} order by ${scanResolutionNotes.recordedAt} desc, ${scanResolutionNotes.id} desc)`.as(
            "note_rank",
          ),
        })
        .from(scanResolutionNotes)
        .where(
          inArray(
            scanResolutionNotes.eventId,
            pageRows.map((row) => row.id),
          ),
        )
        .as("ranked_scan_notes");
      const noteRows = pageRows.length
        ? await tx
            .select()
            .from(rankedNotes)
            .where(lte(rankedNotes.rank, 20))
            .orderBy(desc(rankedNotes.recordedAt), desc(rankedNotes.id))
        : [];
      const notesByEvent = new Map<string, ScanLogEntry["notes"]>();
      for (const note of noteRows) {
        const notes = notesByEvent.get(note.eventId) ?? [];
        notes.push({
          id: note.id,
          recordedAt: note.recordedAt.toISOString(),
          resolution: note.resolution,
        });
        notesByEvent.set(note.eventId, notes);
      }
      for (const row of rows.slice(0, scanPageSize)) {
        if (!["online", "offline", "legacy"].includes(row.source))
          throw new Error("Unexpected scan transport");
        entries.push({
          ...row,
          source: row.source as ScanLogEntry["source"],
          reportedAt: row.reportedAt.toISOString(),
          receivedAt: row.receivedAt.toISOString(),
          notes: notesByEvent.get(row.id) ?? [],
        });
      }
      const invitationOptions = await tx
        .select({
          id: invitations.id,
          name: sql<string>`coalesce(nullif(${invitations.householdName}, ''), 'Invitation')`,
        })
        .from(invitations)
        .orderBy(asc(invitations.householdName), asc(invitations.id));
      const staffOptions = await tx
        .select({ id: staff.id, name: staff.name })
        .from(staff)
        .orderBy(asc(staff.name), asc(staff.id));
      const deviceOptions = await tx
        .select({ id: registeredDevices.id, name: registeredDevices.name })
        .from(registeredDevices)
        .orderBy(asc(registeredDevices.name), asc(registeredDevices.id));
      return {
        entries,
        hasMore: rows.length > scanPageSize,
        options: { invitations: invitationOptions, staff: staffOptions, devices: deviceOptions },
      };
    },
    { isolationLevel: "repeatable read", accessMode: "read only" },
  );
}

/** Unique request IDs make retries safe; no UPDATE or DELETE path exists. */
export async function appendScanNote(
  database: Database,
  input: { eventId: string; requestId: string; adminId: string; resolution: ScanResolution },
): Promise<{ status: "saved" | "not-found" | "conflict" }> {
  return database.transaction(async (tx) => {
    const [event] = await tx
      .select({ id: scanEvents.id })
      .from(scanEvents)
      .where(eq(scanEvents.id, input.eventId));
    if (!event) return { status: "not-found" };
    const inserted = await tx
      .insert(scanResolutionNotes)
      .values(input)
      .onConflictDoNothing({ target: scanResolutionNotes.requestId })
      .returning({ id: scanResolutionNotes.id });
    if (inserted.length) return { status: "saved" };
    const [existing] = await tx
      .select({
        eventId: scanResolutionNotes.eventId,
        adminId: scanResolutionNotes.adminId,
        resolution: scanResolutionNotes.resolution,
      })
      .from(scanResolutionNotes)
      .where(eq(scanResolutionNotes.requestId, input.requestId));
    return {
      status:
        existing?.eventId === input.eventId &&
        existing.adminId === input.adminId &&
        existing.resolution === input.resolution
          ? "saved"
          : "conflict",
    };
  });
}
