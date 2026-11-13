"use server";

import "server-only";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/modules/shared/server/db/client";
import { staffPushSubscriptions } from "@/modules/shared/server/db/schema";
import { currentStaffDevice } from "@/modules/shared/server/staff-cookies";
import { logger } from "@/modules/shared/lib/logger";
import { pushSubscriptionSchema } from "../lib/staff-push";
import { staffPushConfig } from "./staff-push-config";

const stationSchema = z.enum(["kitchen", "bar"]);

export async function readStaffPushConfig(station: unknown) {
  const parsed = stationSchema.safeParse(station);
  if (!parsed.success) return null;
  try {
    const session = await currentStaffDevice(parsed.data);
    const config = staffPushConfig();
    if (!session || !config) return null;
    const [saved] = await db
      .select()
      .from(staffPushSubscriptions)
      .where(eq(staffPushSubscriptions.deviceId, session.device.id));
    const current =
      saved &&
      saved.staffId === session.identity.staffId &&
      saved.station === parsed.data &&
      saved.credentialVersion === session.identity.credentialVersion &&
      saved.expiresAt.getTime() > Date.now();
    return { publicKey: config.publicKey, enabledEndpoint: current ? saved.endpoint : null };
  } catch {
    return null;
  }
}

export async function saveStaffPush(station: unknown, value: unknown): Promise<boolean> {
  const role = stationSchema.safeParse(station);
  const subscription = pushSubscriptionSchema.safeParse(value);
  if (!role.success || !subscription.success || !staffPushConfig()) return false;
  try {
    const session = await currentStaffDevice(role.data);
    if (!session) return false;
    const row = {
      deviceId: session.device.id,
      staffId: session.identity.staffId,
      station: role.data,
      credentialVersion: session.identity.credentialVersion,
      expiresAt: session.expiresAt,
      endpoint: subscription.data.endpoint,
      ...subscription.data.keys,
      createdAt: new Date(),
      lastDeliveredAt: null,
    };
    await db
      .insert(staffPushSubscriptions)
      .values(row)
      .onConflictDoUpdate({ target: staffPushSubscriptions.deviceId, set: row });
    return true;
  } catch {
    logger.child({ module: "staff-push" }).warn("Could not save notification preference");
    return false;
  }
}

export async function removeStaffPush(station: unknown): Promise<boolean> {
  const role = stationSchema.safeParse(station);
  if (!role.success) return false;
  try {
    const session = await currentStaffDevice(role.data);
    if (!session) return false;
    await db
      .delete(staffPushSubscriptions)
      .where(eq(staffPushSubscriptions.deviceId, session.device.id));
    return true;
  } catch {
    logger.child({ module: "staff-push" }).warn("Could not remove notification preference");
    return false;
  }
}
