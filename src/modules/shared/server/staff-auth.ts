import "server-only";

import { and, eq, isNotNull, isNull } from "drizzle-orm";
import { z } from "zod";

import { staffEventExpiry } from "../lib/staff-expiry";
import { db, schema } from "./db/client";
import { withStaffPinAttempt } from "./staff-attempts";
import { verifyStaffPin } from "./staff-pin";
import { readStaffSession, type StaffSessionIdentity } from "./staff-session";

export const staffRoleSchema = z.enum(["gate", "kitchen", "bar"]);
export type StaffRole = z.infer<typeof staffRoleSchema>;
export type StaffSignInResult =
  | { status: "success"; value: StaffSessionIdentity & { expiresAt: Date } }
  | { status: "wrong" | "expired" | "locked" | "unavailable" };

async function eventExpiry(): Promise<Date | null> {
  const [settings] = await db
    .select({
      eventDate: schema.eventSettings.eventDate,
      timeZone: schema.eventSettings.timeZone,
    })
    .from(schema.eventSettings)
    .where(eq(schema.eventSettings.id, 1));
  return settings ? staffEventExpiry(settings.eventDate, settings.timeZone) : null;
}

export async function signInStaff(
  pin: string,
  role: StaffRole,
  deviceId: string,
): Promise<StaffSignInResult> {
  const cutoff = await eventExpiry();
  if (!cutoff) return { status: "unavailable" };
  if (cutoff <= new Date()) return { status: "expired" };
  const [device] = await db
    .select()
    .from(schema.registeredDevices)
    .where(eq(schema.registeredDevices.id, deviceId));
  if (device?.revokedAt || (device && device.role !== role)) return { status: "wrong" };

  return withStaffPinAttempt<StaffSessionIdentity & { expiresAt: Date }>(deviceId, async (tx) => {
    if (!/^[0-9]{6}$/.test(pin)) return { status: "wrong" };
    const candidates = await tx
      .select()
      .from(schema.staff)
      .where(and(isNotNull(schema.staff.pinHash), isNull(schema.staff.revokedAt)));
    let matched: (typeof candidates)[number] | undefined;
    // Do not return early: matching staff position must not determine response time.
    let matches = 0;
    for (const candidate of candidates) {
      if (candidate.pinHash && (await verifyStaffPin(pin, candidate.pinHash))) {
        matched = candidate;
        matches++;
      }
    }
    // Ambiguous credentials must be reset by an administrator, never select an identity arbitrarily.
    if (!matched || matches !== 1 || matched.role !== role) return { status: "wrong" };
    const [current] = await tx
      .select()
      .from(schema.staff)
      .where(eq(schema.staff.id, matched.id))
      .for("share");
    if (
      !current ||
      current.revokedAt ||
      current.role !== role ||
      current.pinHash !== matched.pinHash ||
      current.credentialVersion !== matched.credentialVersion
    )
      return { status: "wrong" };
    matched = current;
    const now = new Date();
    if (
      !matched.pinExpiresAt ||
      !matched.pinIssuedAt ||
      matched.pinIssuedAt > now ||
      matched.pinExpiresAt <= now ||
      cutoff <= now
    ) {
      return { status: "expired" };
    }
    const expiresAt = new Date(Math.min(cutoff.getTime(), matched.pinExpiresAt.getTime()));
    await tx
      .insert(schema.registeredDevices)
      .values({
        id: deviceId,
        name: `${role} device`,
        role,
        registeredByStaffId: matched.id,
      })
      .onConflictDoNothing();
    const [registered] = await tx
      .select()
      .from(schema.registeredDevices)
      .where(eq(schema.registeredDevices.id, deviceId))
      .for("share");
    if (!registered || registered.revokedAt || registered.role !== role) return { status: "wrong" };
    return {
      status: "success",
      value: {
        staffId: matched.id,
        role,
        credentialVersion: matched.credentialVersion,
        expiresAt,
      },
    };
  });
}

/** Every privileged operation must call this; a valid signature alone grants no access. */
export async function authenticateStaffSession(
  token: string,
  deviceId: string,
  role: StaffRole,
  key: Buffer,
): Promise<{ identity: StaffSessionIdentity; expiresAt: Date } | null> {
  const session = readStaffSession(token, deviceId, key);
  if (!session || session.role !== role) return null;
  const cutoff = await eventExpiry();
  const now = new Date();
  if (!cutoff || cutoff <= now) return null;
  const [record] = await db.select().from(schema.staff).where(eq(schema.staff.id, session.staffId));
  const [device] = await db
    .select()
    .from(schema.registeredDevices)
    .where(eq(schema.registeredDevices.id, deviceId));
  if (
    !record ||
    !device ||
    record.role !== role ||
    device.role !== role ||
    record.revokedAt ||
    device.revokedAt ||
    !record.pinHash ||
    !record.pinIssuedAt ||
    record.pinIssuedAt > now ||
    !record.pinExpiresAt ||
    record.pinExpiresAt <= now ||
    record.credentialVersion !== session.credentialVersion
  )
    return null;
  const expiresAt = new Date(
    Math.min(session.exp * 1000, cutoff.getTime(), record.pinExpiresAt.getTime()),
  );
  // Database reads can span the deadline; never issue a fresh offline grant after it.
  if (expiresAt.getTime() <= Date.now()) return null;
  return {
    identity: { staffId: record.id, role, credentialVersion: record.credentialVersion },
    expiresAt,
  };
}

/** Preserve identity-only callers while sharing the same live authorization checks. */
export async function authenticateStaff(
  token: string,
  deviceId: string,
  role: StaffRole,
  key: Buffer,
): Promise<StaffSessionIdentity | null> {
  return (await authenticateStaffSession(token, deviceId, role, key))?.identity ?? null;
}
