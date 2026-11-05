"use server";
import "server-only";
import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { z } from "zod";
import { createLogger } from "@/modules/shared/lib/logger";
import { appRoutes } from "@/modules/shared/lib/routes";
import { db } from "@/modules/shared/server/db/client";
import { eventSettings } from "@/modules/shared/server/db/schema";
import { orderingSwitchCopy, type OrderingSwitchState } from "../lib/ordering-switch";
import { withCurrentAdminAccess } from "./current-admin-access";

/** ORD-7: the couple opens and closes guest ordering. Checks admin access itself, like every action. */
export async function setOrderingOpenAction(
  _previous: OrderingSwitchState,
  form: FormData,
): Promise<OrderingSwitchState> {
  const parsed = z.enum(["true", "false"]).safeParse(form.get("open"));
  if (!parsed.success) return { status: "error", message: orderingSwitchCopy.failed };
  const open = parsed.data === "true";
  try {
    const result = await withCurrentAdminAccess(async () => {
      await db
        .insert(eventSettings)
        .values({ id: 1, orderingOpen: open })
        .onConflictDoUpdate({
          target: eventSettings.id,
          set: { orderingOpen: open, updatedAt: new Date() },
        });
    });
    if (!result.ok) return { status: "error", message: result.message };
    revalidatePath(appRoutes.admin.path);
    return {
      status: "saved",
      open,
      message: open ? orderingSwitchCopy.opened : orderingSwitchCopy.closedNow,
    };
  } catch (error) {
    unstable_rethrow(error);
    createLogger({ module: "admin-ordering" }).warn("ordering switch failed");
    return { status: "error", message: orderingSwitchCopy.failed };
  }
}
