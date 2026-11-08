import "server-only";
import { asc, eq } from "drizzle-orm";
import { db } from "@/modules/shared/server/db/client";
import { menuItems } from "@/modules/shared/server/db/schema";
import type { MenuItemInput } from "../lib/menu-item";

export type AdminMenuItem = MenuItemInput & { id: string; available: boolean };

/** Every column the admin edits. Callers must already hold admin access. */
export async function listAdminMenu(): Promise<AdminMenuItem[]> {
  const rows = await db
    .select({
      id: menuItems.id,
      name: menuItems.name,
      description: menuItems.description,
      category: menuItems.category,
      station: menuItems.station,
      maxPerOrder: menuItems.maxPerOrder,
      sortOrder: menuItems.sortOrder,
      dietaryTags: menuItems.dietaryTags,
      available: menuItems.isAvailable,
    })
    .from(menuItems)
    .orderBy(asc(menuItems.sortOrder), asc(menuItems.name));
  return rows.map((row) => ({ ...row, description: row.description ?? "" }));
}

const values = (input: MenuItemInput) => ({
  name: input.name,
  description: input.description || null,
  category: input.category,
  station: input.station,
  maxPerOrder: input.maxPerOrder,
  sortOrder: input.sortOrder,
  dietaryTags: input.dietaryTags,
});

export async function insertMenuItem(input: MenuItemInput) {
  const [row] = await db.insert(menuItems).values(values(input)).returning({ id: menuItems.id });
  return row?.id ?? null;
}

export async function updateMenuItem(id: string, input: MenuItemInput) {
  const rows = await db
    .update(menuItems)
    .set({ ...values(input), updatedAt: new Date() })
    .where(eq(menuItems.id, id))
    .returning({ id: menuItems.id });
  return rows.length > 0;
}

export async function setMenuItemAvailability(id: string, available: boolean) {
  const rows = await db
    .update(menuItems)
    .set({ isAvailable: available, updatedAt: new Date() })
    .where(eq(menuItems.id, id))
    .returning({ id: menuItems.id });
  return rows.length > 0;
}

/** Returns "in-use" when an order references the item; ordered items stay on record. */
export async function deleteMenuItem(id: string): Promise<"deleted" | "missing" | "in-use"> {
  try {
    const rows = await db
      .delete(menuItems)
      .where(eq(menuItems.id, id))
      .returning({ id: menuItems.id });
    return rows.length ? "deleted" : "missing";
  } catch (error) {
    if (isForeignKeyViolation(error)) return "in-use";
    throw error;
  }
}

function isForeignKeyViolation(error: unknown): boolean {
  for (let current: unknown = error; current; current = (current as { cause?: unknown }).cause)
    if ((current as { code?: unknown }).code === "23503") return true;
  return false;
}
