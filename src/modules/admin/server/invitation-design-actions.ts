"use server";
import "server-only";
import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import {
  invitationDesignInput,
  type InvitationDesignState,
} from "@/modules/shared/lib/invitation-design";
import { db } from "@/modules/shared/server/db/client";
import { saveInvitationDesign } from "@/modules/shared/server/invitation-design";
import { createLogger } from "@/modules/shared/lib/logger";
import { withCurrentAdminAccess } from "./current-admin-access";

export async function saveInvitationDesignAction(
  _previous: InvitationDesignState,
  form: FormData,
): Promise<InvitationDesignState> {
  try {
    const result = await withCurrentAdminAccess(async (actorId): Promise<InvitationDesignState> => {
      const version = form.get("version");
      const parsed = invitationDesignInput.safeParse({
        version: typeof version === "string" && /^\d+$/.test(version) ? Number(version) : NaN,
        photoId: form.get("photoId") || null,
        photoAlt: form.get("photoAlt"),
        headline: form.get("headline"),
        subline: form.get("subline"),
      });
      if (!parsed.success)
        return {
          status: "error",
          message: "Check the wording and add a description for your photo.",
        };
      return saveInvitationDesign(db, parsed.data, actorId);
    });
    if (!result.ok) return { status: "error", message: result.message };
    if (result.value.status === "saved") revalidatePath("/", "layout");
    return result.value;
  } catch (error) {
    unstable_rethrow(error);
    createLogger({ module: "invitation-design" }).warn("Invitation design save unavailable");
    return {
      status: "error",
      message: "We couldn’t save the design. Your wording is still here; please try again.",
    };
  }
}
