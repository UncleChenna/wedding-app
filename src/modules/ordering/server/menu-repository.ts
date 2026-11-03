import "server-only";
import { asc } from "drizzle-orm";
import { db } from "@/modules/shared/server/db/client";
import { menuItems } from "@/modules/shared/server/db/schema";
import type { MenuItem } from "../lib/menu";

export async function listMenuItems(): Promise<MenuItem[]> {
  const rows = await db
    .select({
      id: menuItems.id,
      name: menuItems.name,
      description: menuItems.description,
      category: menuItems.category,
      maxPerOrder: menuItems.maxPerOrder,
      available: menuItems.isAvailable,
      dietaryTags: menuItems.dietaryTags,
    })
    .from(menuItems)
    .orderBy(asc(menuItems.sortOrder), asc(menuItems.name));
  return rows;
}

export async function listMenuAvailability() {
  return db
    .select({ id: menuItems.id, available: menuItems.isAvailable })
    .from(menuItems)
    .orderBy(asc(menuItems.sortOrder), asc(menuItems.name));
}
