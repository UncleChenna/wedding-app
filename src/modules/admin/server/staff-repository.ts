import "server-only";
import { and, asc, eq, inArray, isNotNull, isNull, ne, sql } from "drizzle-orm";
import { staffEventExpiry } from "@/modules/shared/lib/staff-expiry";
import type { Db } from "@/modules/shared/server/db/client";
import { hostTables, staff, tables } from "@/modules/shared/server/db/schema";
import { getEventSettings } from "@/modules/shared/server/settings";
import { hashStaffPin, verifyStaffPin } from "@/modules/shared/server/staff-pin";
import type { StaffRole } from "@/modules/shared/server/staff-auth";
import { newStaffPin } from "../lib/staff-pin";

export type StaffMember = {
  id: string;
  name: string;
  role: StaffRole;
  pinExpiresAt: Date | null;
  revoked: boolean;
  /** Has a PIN that still works now. */
  pinActive: boolean;
  whatsappNumber: string | null;
  alertsOptIn: boolean;
  /** Table numbers a table host looks after; empty for everyone else. */
  hostTables: number[];
};

export async function listStaff(
  database: Pick<Db, "select">,
  now: Date = new Date(),
): Promise<StaffMember[]> {
  const rows = await database
    .select({
      id: staff.id,
      name: staff.name,
      role: staff.role,
      pinExpiresAt: staff.pinExpiresAt,
      revokedAt: staff.revokedAt,
      whatsappNumber: staff.whatsappNumber,
      alertsOptIn: staff.alertsOptIn,
    })
    .from(staff)
    .where(ne(staff.role, "admin"))
    .orderBy(asc(staff.role), asc(staff.name));
  const assignments = await database
    .select({ staffId: hostTables.staffId, number: tables.number })
    .from(hostTables)
    .innerJoin(tables, eq(tables.id, hostTables.tableId))
    .orderBy(asc(tables.number));
  const byHost = Map.groupBy(assignments, (row) => row.staffId);
  return rows.map(({ revokedAt, role, ...row }) => ({
    ...row,
    hostTables: (byHost.get(row.id) ?? []).map((assignment) => assignment.number),
    role: role as StaffRole,
    revoked: revokedAt !== null,
    pinActive:
      revokedAt === null && row.pinExpiresAt !== null && row.pinExpiresAt.getTime() > now.getTime(),
  }));
}

export async function addStaff(database: Pick<Db, "insert">, name: string, role: StaffRole) {
  const [row] = await database.insert(staff).values({ name, role }).returning({ id: staff.id });
  return row?.id ?? null;
}

export type IssueResult =
  | { status: "issued"; pin: string; expiresAt: Date }
  | { status: "no-time-zone" | "event-over" | "missing" | "no-unique-pin" };

/**
 * Issues a fresh PIN and returns it exactly once; only its scrypt hash is stored. Bumping the
 * credential version signs out every device that used an older PIN for this person. The PIN
 * expires at 06:00 venue time after the wedding (ADR 0020), so a venue time zone is required.
 */
export async function issueStaffPin(
  database: Pick<Db, "transaction">,
  staffId: string,
  options: { now?: Date; pin?: () => string } = {},
): Promise<IssueResult> {
  const now = options.now ?? new Date();
  return database.transaction(async (tx) => {
    const settings = await getEventSettings(tx);
    const expiresAt = staffEventExpiry(settings.eventDate, settings.timeZone);
    if (!expiresAt) return { status: "no-time-zone" };
    if (expiresAt.getTime() <= now.getTime()) return { status: "event-over" };
    const [member] = await tx
      .select({ id: staff.id })
      .from(staff)
      .where(and(eq(staff.id, staffId), ne(staff.role, "admin")))
      .for("update");
    if (!member) return { status: "missing" };
    // Sign-in refuses a PIN that matches two people, so a new one must not match anyone else's.
    const others = await tx
      .select({ hash: staff.pinHash })
      .from(staff)
      .where(and(ne(staff.id, staffId), isNotNull(staff.pinHash), isNull(staff.revokedAt)));
    for (let attempt = 0; attempt < 5; attempt++) {
      const pin = (options.pin ?? newStaffPin)();
      let taken = false;
      for (const other of others)
        if (other.hash && (await verifyStaffPin(pin, other.hash))) taken = true;
      if (taken) continue;
      await tx
        .update(staff)
        .set({
          pinHash: await hashStaffPin(pin),
          pinIssuedAt: now,
          pinExpiresAt: expiresAt,
          revokedAt: null,
          credentialVersion: sql`${staff.credentialVersion} + 1`,
          updatedAt: now,
        })
        .where(eq(staff.id, staffId));
      return { status: "issued", pin, expiresAt };
    }
    return { status: "no-unique-pin" };
  });
}

/** Removes access at once: no PIN, a newer credential version, and a revoked mark. */
export async function revokeStaff(database: Pick<Db, "update">, staffId: string, now = new Date()) {
  const rows = await database
    .update(staff)
    .set({
      pinHash: null,
      pinIssuedAt: null,
      pinExpiresAt: null,
      revokedAt: now,
      credentialVersion: sql`${staff.credentialVersion} + 1`,
      updatedAt: now,
    })
    .where(and(eq(staff.id, staffId), ne(staff.role, "admin")))
    .returning({ id: staff.id });
  return rows.length > 0;
}

/**
 * Saves a kitchen or bar person's WhatsApp number and alert choice (TICKET-086). Returns false
 * when nobody at a station matches, so gate staff and admins can't be opted in.
 */
export async function setAlertContact(
  database: Pick<Db, "update">,
  staffId: string,
  contact: { number: string | null; optIn: boolean },
  now = new Date(),
) {
  const rows = await database
    .update(staff)
    .set({ whatsappNumber: contact.number, alertsOptIn: contact.optIn, updatedAt: now })
    .where(and(eq(staff.id, staffId), inArray(staff.role, ["kitchen", "bar"])))
    .returning({ id: staff.id });
  return rows.length > 0;
}

export type HostTablesResult =
  | { status: "saved"; count: number }
  | { status: "missing" }
  | { status: "unknown"; numbers: number[] };

/**
 * Replaces a table host's tables (TICKET-082). Every number must be a real table; nothing
 * changes otherwise. Only `host` staff can have tables.
 */
export async function setHostTables(
  database: Pick<Db, "transaction">,
  staffId: string,
  numbers: readonly number[],
): Promise<HostTablesResult> {
  return database.transaction(async (tx) => {
    const [host] = await tx
      .select({ id: staff.id })
      .from(staff)
      .where(and(eq(staff.id, staffId), eq(staff.role, "host")))
      .for("update");
    if (!host) return { status: "missing" };
    const found = numbers.length
      ? await tx
          .select({ id: tables.id, number: tables.number })
          .from(tables)
          .where(inArray(tables.number, [...numbers]))
      : [];
    const unknown = numbers.filter((number) => !found.some((table) => table.number === number));
    if (unknown.length) return { status: "unknown", numbers: unknown };
    await tx.delete(hostTables).where(eq(hostTables.staffId, staffId));
    if (found.length)
      await tx.insert(hostTables).values(found.map((table) => ({ staffId, tableId: table.id })));
    return { status: "saved", count: found.length };
  });
}
