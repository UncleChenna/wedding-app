"use server";

import { unstable_rethrow } from "next/navigation";
import { ZodError } from "zod";
import { createLogger } from "@/modules/shared/lib/logger";
import {
  saveValidatedThemeDraft,
  type ThemeDraftResult,
} from "@/modules/theming/server/theme-drafts";
import { persistThemeDraft } from "@/modules/theming/server/theme-draft-repository";
import { activateThemeSelection } from "@/modules/theming/server/active-themes";
import { ThemeValidationError } from "@/modules/theming/lib/load-theme";
import { currentAdminAccess } from "./current-admin-access";

export async function saveThemeDraftAction(input: unknown): Promise<ThemeDraftResult> {
  return saveValidatedThemeDraft(input, {
    authorize: async () => (await currentAdminAccess()).status === "ready",
    save: persistThemeDraft,
  });
}

export async function activateThemeDraftAction(
  input: unknown,
): Promise<
  { status: "activated" } | { status: "denied" | "invalid" | "unavailable"; message: string }
> {
  try {
    if ((await currentAdminAccess()).status !== "ready") {
      return { status: "denied", message: "Please complete two-step admin sign-in first." };
    }
    await activateThemeSelection(input);
    return { status: "activated" };
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof ThemeValidationError) return { status: "invalid", message: error.message };
    if (error instanceof ZodError)
      return { status: "invalid", message: "Choose a valid light and dark theme." };
    createLogger({ module: "admin-themes" }).warn("theme activation unavailable");
    return {
      status: "unavailable",
      message: "We couldn’t activate the themes just now. Please try again.",
    };
  }
}
