import "server-only";
import { cacheLife, cacheTag, revalidateTag } from "next/cache";
import { logger } from "@/modules/shared/lib/logger";
import { z } from "zod";
import { validateThemePublication } from "./theme-publication";
import { readStoredThemes, selectionSchema } from "./stored-themes";

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
          import("./theme-repository").then(({ loadPublishedThemeSelection }) =>
            loadPublishedThemeSelection(),
          ),
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

/** Internal only. Admin actions must authorize before calling this service. */
export async function activateThemeSelection(input: unknown): Promise<void> {
  const { reviewed, ...selection } = selectionSchema
    .extend({
      reviewed: z.object({ light: z.unknown(), dark: z.unknown() }).strict(),
    })
    .parse(input);
  const expected = validateThemePublication(reviewed);
  const { publishThemeDrafts } = await import("./theme-draft-repository");
  await publishThemeDrafts(selection, undefined, expected);
  revalidateTag(THEME_TAG, { expire: 0 });
}
