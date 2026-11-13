import "server-only";
import { asc } from "drizzle-orm";
import { db } from "@/modules/shared/server/db/client";
import { tables } from "@/modules/shared/server/db/schema";
import { getEventSettings } from "@/modules/shared/server/settings";
import { clientEnv } from "@/modules/shared/lib/env/client";
import { createLogger } from "@/modules/shared/lib/logger";
import { requireAdminPageAccess } from "./current-admin-access";
import {
  buildTableCards,
  orderUrl,
  wifiDetails,
  type TableCard,
  type TableCardWifi,
} from "../lib/table-cards";

export type TableCardsResult =
  | { ok: true; cards: TableCard[]; orderUrl: string; wifi: TableCardWifi | null }
  | { ok: false; message: string };

export async function getTableCards(): Promise<TableCardsResult> {
  await requireAdminPageAccess();
  try {
    const [rows, settings] = await Promise.all([
      db
        .select({ number: tables.number, name: tables.name })
        .from(tables)
        .orderBy(asc(tables.number)),
      getEventSettings(),
    ]);
    return {
      ok: true,
      cards: buildTableCards(rows),
      orderUrl: orderUrl(clientEnv.NEXT_PUBLIC_SITE_URL),
      wifi: wifiDetails(settings),
    };
  } catch {
    createLogger({ module: "table-cards" }).warn("Table cards unavailable");
    return { ok: false, message: "Your table cards couldn't load. Please try again shortly." };
  }
}
