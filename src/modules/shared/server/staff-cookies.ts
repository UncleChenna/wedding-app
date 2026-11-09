import "server-only";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { authenticateStaffSession, type StaffRole } from "./staff-auth";
import { readStaffDeviceCookie } from "./staff-device-cookie";
import { serverEnv } from "./env";
import { eq } from "drizzle-orm";
import { db } from "./db/client";
import { registeredDevices } from "./db/schema";

export const STAFF_DEVICE_COOKIE = "wedding-staff-device";
export const STAFF_SESSION_COOKIE = "wedding-staff-session";
export const staffCookieOptions = {
  httpOnly: true,
  secure: serverEnv.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/",
};

export function staffSigningKey(): Buffer | null {
  return serverEnv.STAFF_SESSION_SECRET ? Buffer.from(serverEnv.STAFF_SESSION_SECRET, "hex") : null;
}
export async function currentStaff(role: StaffRole) {
  return (await currentStaffDevice(role))?.identity ?? null;
}

/**
 * The signed-in staff identity and the device it is using (TICKET-064). The device id comes from
 * the signed device cookie; its name is whatever the admin last called it, read fresh each time.
 */
export async function currentStaffDevice(role: StaffRole) {
  await connection();
  const key = staffSigningKey();
  if (!key) return null;
  const jar = await cookies();
  const device = readStaffDeviceCookie(jar.get(STAFF_DEVICE_COOKIE)?.value ?? "", key);
  const token = jar.get(STAFF_SESSION_COOKIE)?.value;
  if (!device || !token) return null;
  const session = await authenticateStaffSession(token, device, role, key);
  if (!session) return null;
  const [row] = await db
    .select({ name: registeredDevices.name })
    .from(registeredDevices)
    .where(eq(registeredDevices.id, device));
  if (session.expiresAt.getTime() <= Date.now()) return null;
  return { ...session, device: { id: device, name: row?.name ?? null } };
}
