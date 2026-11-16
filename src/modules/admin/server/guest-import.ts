import "server-only";
import { createHash, randomUUID } from "node:crypto";
import { and, eq, isNull, isNotNull, lt, or, sql } from "drizzle-orm";
import type { Db } from "@/modules/shared/server/db/client";
import { guestImportBatches, guests, invitations, tables } from "@/modules/shared/server/db/schema";
import { generateInvitationToken } from "@/modules/invitations/lib/token";
import {
  importCommitSchema,
  parseGuestImportCsv,
  type ImportParty,
  type ImportPreviewResult,
  type ImportCommitResult,
  type ImportError,
} from "../lib/guest-import";

type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];
function digestOf(parties: ImportParty[]) {
  const data = parties.map(({ rows: _rows, ...party }) => party);
  data.sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
  return createHash("sha256").update(JSON.stringify(data)).digest("hex");
}
/** Recognize committed six-column imports from before labels were removed.
 * This transient compatibility hash derives only from guest names; it is never stored as a label.
 */
function legacyDigestOf(parties: ImportParty[]) {
  const data = parties.map(({ rows: _rows, ...party }) => ({
    householdName: party.members[0]?.name ?? "",
    ...party,
  }));
  data.sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
  return createHash("sha256").update(JSON.stringify(data)).digest("hex");
}
async function inspect(tx: Tx, parties: ImportParty[]) {
  const contacts = await tx.select({ email: guests.email, phone: guests.phone }).from(guests);
  const available = await tx
    .select({ id: tables.id, number: tables.number, name: tables.name, capacity: tables.capacity })
    .from(tables)
    .orderBy(tables.id);
  const errors: ImportError[] = [];
  const emails = new Set(contacts.flatMap((m) => (m.email ? [m.email.trim().toLowerCase()] : [])));
  const phones = new Set(contacts.flatMap((m) => (m.phone ? [m.phone] : [])));
  for (const party of parties) {
    for (const [i, member] of party.members.entries()) {
      if ((member.email && emails.has(member.email)) || (member.phone && phones.has(member.phone)))
        errors.push({
          row: party.rows[i] ?? 2,
          column: "contact",
          message:
            "This contact already exists in the guest list. Correct it or edit the existing invitation.",
        });
    }
    if (party.tableNumber !== null && !available.some((t) => t.number === party.tableNumber))
      errors.push({
        row: party.rows[0] ?? 2,
        column: "table",
        message: "This table does not exist. Create it first or leave the table empty.",
      });
  }
  return {
    errors,
    snapshot: available.filter((t) => parties.some((h) => h.tableNumber === t.number)),
  };
}

export async function previewGuestImport(
  database: Pick<Db, "transaction">,
  csv: unknown,
  actorId: string,
): Promise<ImportPreviewResult> {
  const parsed = parseGuestImportCsv(csv);
  if (!parsed.ok)
    return {
      status: "error",
      message: "Check the CSV rows before importing.",
      errors: parsed.errors,
    };
  // The parser guarantees this; retain the boundary narrowing for the persisted original.
  if (typeof csv !== "string")
    return { status: "error", message: "Choose a CSV file.", errors: [] };
  const { parties } = parsed;
  const digest = digestOf(parties);
  return database.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(182)`);
    await tx
      .update(guestImportBatches)
      .set({ csv: null, tableSnapshot: [] })
      .where(
        and(lt(guestImportBatches.expiresAt, new Date()), isNull(guestImportBatches.invitationIds)),
      );
    const [prior] = await tx
      .select()
      .from(guestImportBatches)
      .where(
        or(
          eq(guestImportBatches.digest, digest),
          and(
            eq(guestImportBatches.digest, legacyDigestOf(parties)),
            isNotNull(guestImportBatches.invitationIds),
          ),
        ),
      );
    if (prior?.invitationIds) {
      if (prior.actorId !== actorId)
        return {
          status: "error",
          message:
            "These guests were already imported by another administrator. Review the guest list.",
          errors: [],
        };
      return {
        status: "preview",
        preview: {
          id: prior.id,
          digest: prior.digest,
          expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
          parties,
          counts: {
            invitations: parties.length,
            guests: parties.reduce((n, h) => n + h.members.length, 0),
          },
        },
      };
    }
    const checked = await inspect(tx, parties);
    if (checked.errors.length)
      return {
        status: "error",
        message: "Resolve these conflicts before importing.",
        errors: checked.errors,
      };
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
    const values = { actorId, csv, tableSnapshot: checked.snapshot, expiresAt };
    const [stored] = prior
      ? await tx
          .update(guestImportBatches)
          .set({ ...values, id: randomUUID() })
          .where(eq(guestImportBatches.id, prior.id))
          .returning()
      : await tx
          .insert(guestImportBatches)
          .values({ ...values, digest })
          .returning();
    if (!stored) throw new Error("Import preview insert failed");
    return {
      status: "preview",
      preview: {
        id: stored.id,
        digest,
        expiresAt: expiresAt.toISOString(),
        parties,
        counts: {
          invitations: parties.length,
          guests: parties.reduce((n, h) => n + h.members.length, 0),
        },
      },
    };
  });
}

export async function commitGuestImport(
  database: Pick<Db, "transaction">,
  input: unknown,
  actorId: string,
  token = generateInvitationToken,
  now: () => number = Date.now,
): Promise<ImportCommitResult> {
  const parsed = importCommitSchema.safeParse(input);
  const stale: ImportCommitResult = {
    status: "error",
    message:
      "This preview changed or expired. Upload the CSV again and review it before importing.",
  };
  if (!parsed.success) return stale;
  return database.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(182)`);
    const [batch] = await tx
      .select()
      .from(guestImportBatches)
      .where(eq(guestImportBatches.id, parsed.data.previewId))
      .for("update");
    if (!batch || batch.actorId !== actorId || batch.digest !== parsed.data.digest) return stale;
    if (batch.invitationIds)
      return {
        status: "committed",
        invitationIds: batch.invitationIds,
        count: batch.invitationIds.length,
        replayed: true,
      };
    if (!batch.csv || batch.expiresAt.getTime() <= now()) return stale;
    const data = parseGuestImportCsv(batch.csv);
    if (!data.ok || digestOf(data.parties) !== batch.digest) return stale;
    // Serialize against all guest-list writers, including non-import admin edits. This
    // bounded transaction never updates an existing invitation, reply or admission.
    await tx.execute(sql`lock table invitations, guests, tables in share row exclusive mode`);
    const checked = await inspect(tx, data.parties);
    if (
      checked.errors.length ||
      JSON.stringify(checked.snapshot) !== JSON.stringify(batch.tableSnapshot)
    )
      return stale;
    // A writer or conflict recheck may outlast the approved preview's deadline.
    if (batch.expiresAt.getTime() <= now()) return stale;
    const invitationIds: string[] = [];
    for (const party of data.parties) {
      const tableId = checked.snapshot.find((t) => t.number === party.tableNumber)?.id ?? null;
      const [invitation] = await tx
        .insert(invitations)
        .values({
          side: party.side,
          tableId,
          maxTagAlongs: party.maxTagAlongs,
          status: "draft",
          tokenVersion: 1,
          token: token(),
        })
        .returning({ id: invitations.id });
      if (!invitation) throw new Error("Import invitation insert failed");
      await tx.insert(guests).values(
        party.members.map((member) => ({
          ...member,
          invitationId: invitation.id,
          tableId,
          isPrimary: true,
        })),
      );
      invitationIds.push(invitation.id);
    }
    await tx
      .update(guestImportBatches)
      .set({ invitationIds, csv: null, tableSnapshot: [] })
      .where(eq(guestImportBatches.id, batch.id));
    return { status: "committed", invitationIds, count: invitationIds.length, replayed: false };
  });
}
