"use server";
import "server-only";
import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { createLogger } from "@/modules/shared/lib/logger";
import { db } from "@/modules/shared/server/db/client";
import { eventSettings } from "@/modules/shared/server/db/schema";
import { getEventSettings } from "@/modules/shared/server/settings";
import {
  parseSettingsForm,
  settingsCopy,
  submittedSettings,
  type SettingsFormState,
} from "../lib/settings-form";
import { withCurrentAdminAccess } from "./current-admin-access";

/** Saves the event settings form. Checks admin access itself, like every admin action. */
export async function saveSettingsAction(
  _previous: SettingsFormState,
  form: FormData,
): Promise<SettingsFormState> {
  try {
    const result = await withCurrentAdminAccess(async (): Promise<SettingsFormState> => {
      const parsed = parseSettingsForm(form, await getEventSettings());
      if (!parsed.ok)
        return {
          status: "error",
          message: settingsCopy.invalid,
          fields: parsed.fields,
          values: submittedSettings(form),
        };
      const {
        orderingOpen: _open,
        activeThemeId: _light,
        activeDarkThemeId: _dark,
        ...values
      } = parsed.value;
      await db
        .insert(eventSettings)
        .values({ id: 1, ...values, coupleNames: [...values.coupleNames] })
        .onConflictDoUpdate({
          target: eventSettings.id,
          set: { ...values, coupleNames: [...values.coupleNames], updatedAt: new Date() },
        });
      return { status: "saved", message: settingsCopy.saved };
    });
    if (!result.ok) return { status: "error", message: result.message };
    // Guest pages cache event details briefly; refresh every page so invitations show this now.
    if (result.value.status === "saved") revalidatePath("/", "layout");
    return result.value;
  } catch (error) {
    unstable_rethrow(error);
    createLogger({ module: "admin-settings" }).warn("settings save failed");
    return { status: "error", message: settingsCopy.failed };
  }
}
