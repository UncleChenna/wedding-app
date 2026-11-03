import "server-only";
import { getEventSettings } from "@/modules/shared/server/settings";
import { logger } from "@/modules/shared/lib/logger";
import { readPublicEventDetails } from "./read-public-event-details";

const log = logger.child({ module: "invitations" });

/** Bounded public display lookup; private actions retain their strict settings reader. */
export async function getPublicEventDetails() {
  return readPublicEventDetails(
    async () => {
      let timer: ReturnType<typeof setTimeout> | undefined;
      try {
        return await Promise.race([
          getEventSettings(),
          new Promise<never>((_, reject) => {
            timer = setTimeout(() => reject(new Error("Public details unavailable")), 2000);
          }),
        ]);
      } finally {
        clearTimeout(timer);
      }
    },
    (message) => log.warn(message),
  );
}
