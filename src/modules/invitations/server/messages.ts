import "server-only";
import { db, type Db } from "@/modules/shared/server/db/client";
import { getEventSettings } from "@/modules/shared/server/settings";
import { renderInvitationMessages } from "../lib/messages";

/** Authorized callers supply the recipient and personal URL; this never sends a message. */
export async function getInvitationMessages(recipient: unknown, database: Pick<Db, "select"> = db) {
  return renderInvitationMessages(recipient, await getEventSettings(database));
}
