import "server-only";
import { loadTheme, ThemeValidationError } from "../lib/load-theme";
import type { Theme } from "../lib/schema";

export type ThemeDraftResult =
  | { status: "saved"; id: string }
  | { status: "denied" | "invalid" | "unavailable"; message: string };

type DraftDependencies = {
  /** Public admin actions must supply their current AAL2 administrator check. */
  authorize: () => Promise<boolean>;
  /** Draft-only write: must not change published tokens, selection or live caches. */
  save: (theme: Theme) => Promise<void>;
};

/** Internal service; its caller owns authentication and the draft-only repository. */
export async function saveValidatedThemeDraft(
  input: unknown,
  dependencies: DraftDependencies,
): Promise<ThemeDraftResult> {
  const unavailable: ThemeDraftResult = {
    status: "unavailable",
    message: "We couldn’t save the theme just now. Please try again.",
  };
  try {
    if (!(await dependencies.authorize())) {
      return { status: "denied", message: "Please complete two-step admin sign-in first." };
    }
  } catch {
    return unavailable;
  }
  let theme: Theme;
  try {
    theme = loadTheme(input);
  } catch (error) {
    if (error instanceof ThemeValidationError) return { status: "invalid", message: error.message };
    return unavailable;
  }
  try {
    await dependencies.save(theme);
    return { status: "saved", id: theme.id };
  } catch {
    // Never return database exception text or connection details to the caller.
    return unavailable;
  }
}
