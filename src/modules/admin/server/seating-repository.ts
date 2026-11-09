import "server-only";
import { asc, desc, eq, sql } from "drizzle-orm";
import type { Db } from "@/modules/shared/server/db/client";
import { guests, invitations, orders, rsvps, tables } from "@/modules/shared/server/db/schema";
import { assignTableSchema, deleteTableSchema, saveTableSchema } from "../lib/seating-input";
import { seatingOccupancy, seatingTableVersion, type SeatingPlan } from "../lib/seating";

export type SeatingMutation =
  | { ok: true; message: string }
  | {
      ok: false;
      message: string;
      fields?: Partial<Record<"number" | "name" | "capacity", string>>;
    };
const changed: SeatingMutation = {
  ok: false,
  message: "This seating detail changed. Refresh the page and try again.",
};

async function planRows(database: Pick<Db, "select">): Promise<SeatingPlan> {
  const tableRows = await database
    .select({
      id: tables.id,
      number: tables.number,
      name: tables.name,
      capacity: tables.capacity,
      hasOrders: sql<boolean>`exists(select 1 from ${orders} where ${orders.tableId} = ${tables.id})`,
    })
    .from(tables)
    .orderBy(asc(tables.number));
  const households = await database
    .select({
      id: invitations.id,
      householdName: invitations.householdName,
      status: invitations.status,
      tableId: invitations.tableId,
      countAttending: rsvps.countAttending,
    })
    .from(invitations)
    .leftJoin(rsvps, eq(rsvps.invitationId, invitations.id))
    .orderBy(asc(invitations.createdAt), asc(invitations.id));
  const members = await database
    .select({ invitationId: guests.invitationId, name: guests.name })
    .from(guests)
    .orderBy(desc(guests.isPrimary), asc(guests.createdAt), asc(guests.id));
  const names = new Map<string, string[]>();
  for (const member of members)
    names.set(member.invitationId, [...(names.get(member.invitationId) ?? []), member.name]);
  return {
    tables: tableRows,
    parties: households.map((row) => ({
      id: row.id,
      name: row.householdName || names.get(row.id)?.join(" & ") || "Unnamed invitation",
      status: row.status,
      tableId: row.tableId,
      countAttending: row.countAttending,
      namedGuests: names.get(row.id)?.length ?? 0,
    })),
  };
}

/** Internal reader; authorize at its page boundary before calling. */
export function readSeatingPlan(database: Pick<Db, "transaction">) {
  return database.transaction(planRows, {
    isolationLevel: "repeatable read",
    accessMode: "read only",
  });
}

function hasCode(error: unknown, code: string): boolean {
  let current = error;
  for (let depth = 0; depth < 4 && typeof current === "object" && current !== null; depth++) {
    if ("code" in current && current.code === code) return true;
    current = "cause" in current ? current.cause : null;
  }
  return false;
}

function capacityMessage(plan: SeatingPlan, tableId: string | null, message: string): string {
  const table = plan.tables.find((row) => row.id === tableId);
  if (!table) return message;
  const occupancy = seatingOccupancy(
    plan.parties.filter((row) => row.tableId === tableId),
    table.capacity,
  );
  return occupancy.overBy > 0
    ? `${message} Table ${table.number} is ${occupancy.overBy} seat${occupancy.overBy === 1 ? "" : "s"} over capacity, including named guests awaiting a reply.`
    : message;
}

export async function saveSeatingTable(
  database: Pick<Db, "transaction">,
  input: unknown,
): Promise<SeatingMutation> {
  const parsed = saveTableSchema.safeParse(input);
  if (!parsed.success) {
    const fields: Partial<Record<"number" | "name" | "capacity", string>> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.at(-1);
      if (key === "number" || key === "name" || key === "capacity") fields[key] = issue.message;
    }
    return { ok: false, message: "Check the table details and try again.", fields };
  }
  const { id, expected, values } = parsed.data;
  if ((id === null) !== (expected === null)) return changed;
  try {
    return await database.transaction(async (tx) => {
      if (id !== null) {
        const [current] = await tx.select().from(tables).where(eq(tables.id, id)).for("update");
        if (!current || seatingTableVersion(current) !== expected) return changed;
        await tx
          .update(tables)
          .set({ ...values, name: values.name || null, updatedAt: new Date() })
          .where(eq(tables.id, id));
        return { ok: true, message: capacityMessage(await planRows(tx), id, "Table saved.") };
      }
      await tx.insert(tables).values({ ...values, name: values.name || null });
      return { ok: true, message: "Table added." };
    });
  } catch (error) {
    if (hasCode(error, "23505"))
      return {
        ok: false,
        message: "Choose a different table number.",
        fields: { number: "That table number is already in use." },
      };
    throw error;
  }
}

export async function deleteSeatingTable(
  database: Pick<Db, "transaction">,
  input: unknown,
): Promise<SeatingMutation> {
  const parsed = deleteTableSchema.safeParse(input);
  if (!parsed.success) return changed;
  const { id, expected } = parsed.data;
  return database.transaction(async (tx) => {
    const [current] = await tx.select().from(tables).where(eq(tables.id, id)).for("update");
    if (!current || seatingTableVersion(current) !== expected) return changed;
    const [order] = await tx
      .select({ id: orders.id })
      .from(orders)
      .where(eq(orders.tableId, id))
      .limit(1);
    if (order)
      return {
        ok: false,
        message: "This table has order history and must be kept. You can edit its details.",
      };
    const [party] = await tx
      .select({ id: invitations.id })
      .from(invitations)
      .where(eq(invitations.tableId, id))
      .limit(1);
    const [member] = await tx
      .select({ id: guests.id })
      .from(guests)
      .where(eq(guests.tableId, id))
      .limit(1);
    if (party || member)
      return { ok: false, message: "Move or unassign this table’s households before deleting it." };
    await tx.delete(tables).where(eq(tables.id, id));
    return { ok: true, message: "Table deleted." };
  });
}

export async function assignSeatingTable(
  database: Pick<Db, "transaction">,
  input: unknown,
): Promise<SeatingMutation> {
  const parsed = assignTableSchema.safeParse(input);
  if (!parsed.success) return changed;
  const { invitationId, expectedTableId, tableId } = parsed.data;
  return database.transaction(async (tx) => {
    // Same invitation-first lock as RSVP and admin roster edits; never overwrite their fields.
    const [current] = await tx
      .select({ tableId: invitations.tableId })
      .from(invitations)
      .where(eq(invitations.id, invitationId))
      .for("update");
    if (!current || current.tableId !== expectedTableId) return changed;
    if (tableId !== null) {
      const [target] = await tx
        .select({ id: tables.id })
        .from(tables)
        .where(eq(tables.id, tableId))
        .for("update");
      if (!target)
        return { ok: false, message: "That table is no longer available. Choose another table." };
    }
    await tx
      .update(invitations)
      .set({ tableId, updatedAt: new Date() })
      .where(eq(invitations.id, invitationId));
    await tx
      .update(guests)
      .set({ tableId, updatedAt: new Date() })
      .where(eq(guests.invitationId, invitationId));
    return {
      ok: true,
      message: capacityMessage(
        await planRows(tx),
        tableId,
        tableId ? "Household assigned." : "Household unassigned.",
      ),
    };
  });
}
