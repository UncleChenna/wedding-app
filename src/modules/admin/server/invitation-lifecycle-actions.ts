"use server";
import "server-only";
import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { db } from "@/modules/shared/server/db/client";
import { createLogger } from "@/modules/shared/lib/logger";
import { appRoutes } from "@/modules/shared/lib/routes";
import type { LifecycleFormState } from "../lib/invitation-lifecycle";
import { withCurrentAdminAccess } from "./current-admin-access";
import { changeInvitationLifecycle } from "./invitation-lifecycle";

const messages = {
  invalid_input: "Please check the invitation and confirm your choice.",
  missing: "This invitation is no longer available. Refresh the page to check.",
  conflict: "This invitation changed. Refresh the page and check it again.",
  already_revoked: "This invitation has already been revoked.",
  version_exhausted: "This invitation cannot be reissued. Please contact the organiser.",
  token_exhausted: "We couldn't create a new link. Please try again.",
} as const;

export async function changeInvitationLifecycleAction(
  _previous: LifecycleFormState,
  form: FormData,
): Promise<LifecycleFormState> {
  try {
    const result = await withCurrentAdminAccess(async (actorId) => {
      const changed = await changeInvitationLifecycle(
        db,
        {
          invitationId: form.get("invitationId"),
          operation: form.get("operation"),
          expectedVersion: Number(form.get("expectedVersion")),
          expectedStatus: form.get("expectedStatus"),
          confirmation: form.get("confirmation"),
        },
        actorId,
      );
      if (changed.ok)
        createLogger({ module: "invitation-lifecycle" }).info("invitation lifecycle changed", {
          operation: changed.operation,
          actorId,
        });
      return changed;
    });
    if (!result.ok) return { status: "error", message: result.message };
    if (!result.value.ok) return { status: "error", message: messages[result.value.code] };
    revalidatePath(appRoutes.adminSharing.path);
    return {
      status: "saved",
      message:
        result.value.operation === "revoke"
          ? "Invitation revoked. Offline scanners will learn the change when they refresh."
          : "New invitation link ready. Use the sharing options to send it to this household.",
    };
  } catch (error) {
    unstable_rethrow(error);
    createLogger({ module: "invitation-lifecycle" }).warn(
      "invitation lifecycle change unavailable",
    );
    return { status: "error", message: "We couldn't update this invitation. Please try again." };
  }
}
