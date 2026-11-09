import "server-only";
import { db } from "@/modules/shared/server/db/client";
import { getEventSettings } from "@/modules/shared/server/settings";
import { clientEnv } from "@/modules/shared/lib/env/client";
import { createLogger } from "@/modules/shared/lib/logger";
import { preparePassReminder } from "../lib/pass-reminders";
import { requireAdminPageAccess } from "./current-admin-access";
import { readPassReminderRows } from "./pass-reminder-repository";

export async function getPassReminders() {
  await requireAdminPageAccess();
  try {
    const [rows, settings] = await Promise.all([readPassReminderRows(db), getEventSettings()]);
    return {
      status: "ready" as const,
      invitations: rows.map((row) =>
        preparePassReminder(row, settings, clientEnv.NEXT_PUBLIC_SITE_URL),
      ),
    };
  } catch {
    createLogger({ module: "pass-reminders" }).warn("Pass reminder list unavailable");
    return {
      status: "error" as const,
      message: "We couldn't load the pass reminders. Please try again.",
    };
  }
}
