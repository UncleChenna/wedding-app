import "server-only";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { authenticateStaff, type StaffRole } from "./staff-auth";
import { readStaffDeviceCookie } from "./staff-device-cookie";
import { serverEnv } from "./env";

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
  await connection();
  const key = staffSigningKey();
  if (!key) return null;
  const jar = await cookies();
  const device = readStaffDeviceCookie(jar.get(STAFF_DEVICE_COOKIE)?.value ?? "", key);
  const token = jar.get(STAFF_SESSION_COOKIE)?.value;
  if (!device || !token) return null;
  return authenticateStaff(token, device, role, key);
}
