"use server";
import "server-only";
import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { z } from "zod";
import { appRoutes } from "@/modules/shared/lib/routes";
import { createLogger } from "@/modules/shared/lib/logger";
import {
  fieldErrors,
  menuAdminCopy,
  parseMenuItemForm,
  submittedValues,
  type MenuFormState,
} from "../lib/menu-item";
import { withCurrentAdminAccess } from "./current-admin-access";
import {
  deleteMenuItem,
  insertMenuItem,
  setMenuItemAvailability,
  updateMenuItem,
} from "./menu-repository";

const log = createLogger({ module: "admin-menu" });
const idSchema = z.uuid();

/**
 * Every action checks admin access itself: the page layout and request proxy are not enough on
 * their own for a Server Action. Expected problems come back as messages; database errors are
 * logged without details and shown as a retryable failure.
 */
async function guarded(run: () => Promise<MenuFormState>): Promise<MenuFormState> {
  try {
    const result = await withCurrentAdminAccess(run);
    if (!result.ok) return { status: "error", message: result.message };
    if (result.value.status === "saved") revalidatePath(appRoutes.adminMenu.path);
    return result.value;
  } catch (error) {
    unstable_rethrow(error);
    log.warn("menu change failed");
    return { status: "error", message: menuAdminCopy.failed };
  }
}

export async function saveMenuItemAction(
  _previous: MenuFormState,
  form: FormData,
): Promise<MenuFormState> {
  return guarded(async () => {
    const parsed = parseMenuItemForm(form);
    if (!parsed.success)
      return {
        status: "error",
        message: "Please check the highlighted fields.",
        fields: fieldErrors(parsed.error),
        values: submittedValues(form),
      };
    const rawId = form.get("id");
    if (rawId === null || rawId === "") {
      await insertMenuItem(parsed.data);
      return { status: "saved", message: menuAdminCopy.added };
    }
    const id = idSchema.safeParse(rawId);
    if (!id.success || !(await updateMenuItem(id.data, parsed.data)))
      return { status: "error", message: menuAdminCopy.missing };
    return { status: "saved", message: menuAdminCopy.saved };
  });
}

export async function setAvailabilityAction(
  _previous: MenuFormState,
  form: FormData,
): Promise<MenuFormState> {
  return guarded(async () => {
    const id = idSchema.safeParse(form.get("id"));
    const available = z.enum(["true", "false"]).safeParse(form.get("available"));
    if (!id.success || !available.success)
      return { status: "error", message: menuAdminCopy.missing };
    const next = available.data === "true";
    if (!(await setMenuItemAvailability(id.data, next)))
      return { status: "error", message: menuAdminCopy.missing };
    return { status: "saved", message: next ? menuAdminCopy.available : menuAdminCopy.soldOut };
  });
}

export async function deleteMenuItemAction(
  _previous: MenuFormState,
  form: FormData,
): Promise<MenuFormState> {
  return guarded(async () => {
    const id = idSchema.safeParse(form.get("id"));
    if (!id.success) return { status: "error", message: menuAdminCopy.missing };
    const result = await deleteMenuItem(id.data);
    if (result === "in-use") return { status: "error", message: menuAdminCopy.inUse };
    if (result === "missing") return { status: "error", message: menuAdminCopy.missing };
    return { status: "saved", message: menuAdminCopy.removed };
  });
}
