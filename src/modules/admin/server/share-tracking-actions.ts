"use server";
import "server-only";
import { db } from "@/modules/shared/server/db/client";
import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { createLogger } from "@/modules/shared/lib/logger";
import { withCurrentAdminAccess } from "./current-admin-access";
import { recordInvitationShare, undoInvitationShare } from "./share-tracking";

export async function recordShareAction(input: unknown) {
  try {
    const result = await withCurrentAdminAccess((actor) => recordInvitationShare(input, actor, db));
    if (!result.ok) return result;
    if (result.value.ok) {
      revalidatePath("/admin/sharing");
      revalidatePath("/admin/guests");
    }
    return result.value;
  } catch (error) {
    unstable_rethrow(error);
    createLogger({ module: "share-tracking" }).warn("Sharing record unavailable");
    return {
      ok: false,
      message: "The sharing attempt wasn't recorded. Please try again.",
    } as const;
  }
}
export async function undoShareAction(input: unknown) {
  try {
    const result = await withCurrentAdminAccess((actor) => undoInvitationShare(input, actor, db));
    if (!result.ok) return result;
    if (result.value.ok) {
      revalidatePath("/admin/sharing");
      revalidatePath("/admin/guests");
    }
    return result.value;
  } catch (error) {
    unstable_rethrow(error);
    createLogger({ module: "share-tracking" }).warn("Sharing undo unavailable");
    return {
      ok: false,
      message: "The sharing record couldn't be undone. Please try again.",
    } as const;
  }
}
