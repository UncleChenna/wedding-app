import "server-only";
import { defaultEventSettings, eventSettingsSchema } from "../lib/event-settings";
import { logger } from "../lib/logger";

/** Public branding may fall back during an outage; this never authorizes a private page. */
export async function readManifestCoupleNames(
  load: () => Promise<unknown>,
  warn: () => void,
): Promise<readonly [string, string]> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    const names = await Promise.race([
      load(),
      new Promise<never>((_, reject) => {
        timeout = setTimeout(() => reject(new Error("Manifest name read timed out")), 2000);
      }),
    ]);
    return eventSettingsSchema.shape.coupleNames.parse(names);
  } catch {
    warn();
    return defaultEventSettings.coupleNames;
  } finally {
    clearTimeout(timeout);
  }
}
export async function getManifestCoupleNames() {
  return readManifestCoupleNames(
    async () => (await (await import("./settings")).getEventSettings()).coupleNames,
    () => logger.warn("Public manifest names unavailable; using approved defaults"),
  );
}
