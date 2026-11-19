"use server";
import "server-only";
import { and, asc, eq, sql } from "drizzle-orm";
import type { PrintedCardDetails } from "@/modules/invitations/lib/printed-card";
import { z } from "zod";
import { unstable_rethrow } from "next/navigation";
import { db } from "@/modules/shared/server/db/client";
import { guests, invitations } from "@/modules/shared/server/db/schema";
import { getEventSettings } from "@/modules/shared/server/settings";
import { clientEnv } from "@/modules/shared/lib/env/client";
import { createLogger } from "@/modules/shared/lib/logger";
import { withCurrentAdminAccess } from "./current-admin-access";
import { prepareSharingInvitation, type SharingInvitation } from "../lib/sharing-invitation";

export async function loadSavedInvitationSharing(
  id: string,
): Promise<
  | { ok: true; invitation: SharingInvitation; card: PrintedCardDetails | null }
  | { ok: false; message: string }
> {
  if (!z.uuid().safeParse(id).success)
    return { ok: false, message: "This invitation is unavailable." };
  try {
    const result = await withCurrentAdminAccess(async () => {
      const [row] = await db
        .select({
          id: invitations.id,
          token: invitations.token,
          tokenVersion: invitations.tokenVersion,
          status: invitations.status,
          cardNumber: sql<string | null>`to_jsonb(${invitations})->>'card_number'`,
          maxTagAlongs: invitations.maxTagAlongs,
        })
        .from(invitations)
        .where(eq(invitations.id, id))
        .limit(1);
      if (!row) return null;
      const names = await db
        .select({ name: guests.name })
        .from(guests)
        .where(and(eq(guests.invitationId, id), eq(guests.isPrimary, true)))
        .orderBy(asc(guests.createdAt), asc(guests.id));
      const invitation = prepareSharingInvitation(
        { ...row, name: names.map((g) => g.name).join(" & ") || "Our dear guest" },
        await getEventSettings(),
        clientEnv.NEXT_PUBLIC_SITE_URL,
      );
      const cardNumber = Number(row.cardNumber);
      const card =
        Number.isSafeInteger(cardNumber) && cardNumber > 0
          ? {
              cardNumber,
              guestName: names.map((g) => g.name).join(" & ") || "Our dear guest",
              capacity: Math.max(1, names.length) + row.maxTagAlongs,
            }
          : null;
      return { invitation, card };
    });
    if (!result.ok) return result;
    return result.value
      ? { ok: true, ...result.value }
      : { ok: false, message: "This invitation is unavailable." };
  } catch (error) {
    unstable_rethrow(error);
    createLogger({ module: "admin-sharing" }).warn("Saved invitation sharing unavailable");
    return {
      ok: false,
      message:
        "Your invitation is saved. Preview and sending are temporarily unavailable; try again.",
    };
  }
}
