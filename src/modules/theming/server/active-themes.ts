import "server-only";
import { cacheLife, cacheTag, revalidateTag } from "next/cache";
import { logger } from "@/modules/shared/lib/logger";
import { readStoredThemes, activateStoredThemes } from "./stored-themes";

const THEME_TAG = "active-theme-pair";
const log = logger.child({ module: "theming" });

export async function getStoredActiveThemes() {
  "use cache";
  cacheTag(THEME_TAG);
  cacheLife({ stale: 300, revalidate: 30, expire: 300 });
  const result = await readStoredThemes(
    async () => {
      // Keep env/database initialization inside the fallback boundary.
      let timeout: ReturnType<typeof setTimeout> | undefined;
      try {
        return await Promise.race([
          import("./theme-repository").then(({ loadThemeSelection }) => loadThemeSelection()),
          new Promise<never>((_, reject) => {
            timeout = setTimeout(() => reject(new Error("Theme read timed out")), 2000);
          }),
        ]);
      } finally {
        clearTimeout(timeout);
      }
    },
    (message) => log.warn(message),
  );
  return result.themes;
}

/** No public endpoint. Future admin actions must authorize before calling this service. */
export async function activateThemeSelection(input: unknown): Promise<void> {
  await activateStoredThemes(
    input,
    async (selection) => {
      const { saveThemeSelection } = await import("./theme-repository");
      await saveThemeSelection(selection);
    },
    () => revalidateTag(THEME_TAG, { expire: 0 }),
  );
}
