import "server-only";

import { eq } from "drizzle-orm";
import { db, type Db } from "./db/client";
import { eventSettings } from "./db/schema";
import { readEventSettings } from "./read-event-settings";

export async function getEventSettings(database: Pick<Db, "select"> = db) {
  return readEventSettings(async () => {
    const [row] = await database
      .select()
      .from(eventSettings)
      .where(eq(eventSettings.id, 1))
      .limit(1);
    return row ?? null;
  });
}
