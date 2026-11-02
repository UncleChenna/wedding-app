import "server-only";

import { eq } from "drizzle-orm";
import { db, type Db } from "./db/client";
import { eventSettings } from "./db/schema";
import { invitationVoiceSchema } from "../lib/invitation-voice";
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

/** Internal helper; the admin boundary must authorize before calling. Never exposed as a Server Action. */
export async function saveInvitationVoice(value: unknown, database: Pick<Db, "insert"> = db) {
  const parsed = invitationVoiceSchema.safeParse(value);
  if (!parsed.success) return { ok: false as const, message: "Choose Warm, Playful or Formal." };
  await database
    .insert(eventSettings)
    .values({ id: 1, invitationVoice: parsed.data })
    .onConflictDoUpdate({
      target: eventSettings.id,
      set: { invitationVoice: parsed.data, updatedAt: new Date() },
    });
  return { ok: true as const };
}
