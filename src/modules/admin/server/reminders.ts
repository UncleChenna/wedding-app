import "server-only";
import { readReminderRows } from "./reminder-repository";
import { db } from "@/modules/shared/server/db/client";
import { getEventSettings } from "@/modules/shared/server/settings";
import { clientEnv } from "@/modules/shared/lib/env/client";
import { createLogger } from "@/modules/shared/lib/logger";
import { prepareReminder } from "../lib/reminders";
import { requireAdminPageAccess } from "./current-admin-access";

export async function getReminders() {
  await requireAdminPageAccess();
  try {
    const [rows, settings] = await Promise.all([readReminderRows(db), getEventSettings()]);
    return {
      status: "ready" as const,
      invitations: rows.map((row) => ({
        ...prepareReminder(row, settings, clientEnv.NEXT_PUBLIC_SITE_URL),
        tokenVersion: row.tokenVersion,
        lastSharedAt: row.lastSharedAt ? new Date(row.lastSharedAt).toISOString() : null,
      })),
    };
  } catch {
    createLogger({ module: "reminders" }).warn("Reminder list unavailable");
    return {
      status: "error" as const,
      message: "We couldn't load the reminder list. Please try again.",
    };
  }
}
