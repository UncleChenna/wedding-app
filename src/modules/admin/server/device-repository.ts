import "server-only";
import { asc, eq } from "drizzle-orm";
import type { Db } from "@/modules/shared/server/db/client";
import { registeredDevices, staff } from "@/modules/shared/server/db/schema";

export type AdminDevice = {
  id: string;
  name: string;
  role: "gate" | "kitchen" | "bar";
  registeredAt: Date;
  registeredBy: string | null;
  revoked: boolean;
};

/** Devices that have signed in with a staff PIN (TICKET-031 registers them on first sign-in). */
export async function listDevices(database: Pick<Db, "select">): Promise<AdminDevice[]> {
  const rows = await database
    .select({
      id: registeredDevices.id,
      name: registeredDevices.name,
      role: registeredDevices.role,
      registeredAt: registeredDevices.registeredAt,
      registeredBy: staff.name,
      revokedAt: registeredDevices.revokedAt,
    })
    .from(registeredDevices)
    .leftJoin(staff, eq(staff.id, registeredDevices.registeredByStaffId))
    .orderBy(asc(registeredDevices.role), asc(registeredDevices.registeredAt));
  return rows.map(({ revokedAt, role, ...row }) => ({
    ...row,
    role: role as AdminDevice["role"],
    revoked: revokedAt !== null,
  }));
}

/** The new name shows on the device's next screen and on results it records from now on. */
export async function renameDevice(database: Pick<Db, "update">, id: string, name: string) {
  const rows = await database
    .update(registeredDevices)
    .set({ name, updatedAt: new Date() })
    .where(eq(registeredDevices.id, id))
    .returning({ id: registeredDevices.id });
  return rows.length > 0;
}
