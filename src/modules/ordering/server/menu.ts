import "server-only";
import { logger } from "@/modules/shared/lib/logger";
import type { MenuAvailability, MenuItem } from "../lib/menu";

export type MenuLoad = { status: "ready"; items: MenuItem[] } | { status: "unavailable" };

export async function loadMenu(list: () => Promise<MenuItem[]>): Promise<MenuLoad> {
  try {
    return { status: "ready", items: await list() };
  } catch {
    logger.child({ module: "ordering" }).warn("Menu lookup unavailable");
    return { status: "unavailable" };
  }
}

const headers = {
  "Cache-Control": "private, no-store",
  "X-Robots-Tag": "noindex, nofollow",
};

/**
 * Live sold-out state for an open order page (ORD-2). Display only: order submission
 * revalidates every item against the database at commit time.
 */
export async function menuAvailabilityResponse(
  list: () => Promise<MenuAvailability["items"]>,
  isOpen: () => Promise<boolean>,
): Promise<Response> {
  try {
    const [items, open] = await Promise.all([list(), isOpen()]);
    const body: MenuAvailability = { open, items };
    return Response.json(body, { headers });
  } catch {
    logger.child({ module: "ordering" }).warn("Menu availability unavailable");
    return Response.json({ error: "unavailable" }, { status: 503, headers });
  }
}
