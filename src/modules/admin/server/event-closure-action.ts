"use server";
import "server-only";
import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { db } from "@/modules/shared/server/db/client";
import { createLogger } from "@/modules/shared/lib/logger";
import { currentAdminAccess } from "./current-admin-access";
import { closeEvent, type ClosureResult } from "./event-closure-repository";

export async function closeEventAction(form: FormData): Promise<
  | ClosureResult
  | {
      status: "unauthorized" | "unavailable";
      message: string;
    }
> {
  try {
    if ((await currentAdminAccess()).status !== "ready")
      return { status: "unauthorized", message: "Please complete two-step sign-in first." };
    const result = await closeEvent(db, {
      confirmation: form.get("confirmation"),
      eventDate: form.get("eventDate"),
      evidencePreserved: form.get("evidencePreserved") === "on",
    });
    if (result.status === "closed") {
      revalidatePath("/admin", "layout");
      revalidatePath("/order", "layout");
    }
    return result;
  } catch (error) {
    unstable_rethrow(error);
    createLogger({ module: "event-closure" }).error("Event closure unavailable");
    return {
      status: "unavailable",
      message: "We couldn't confirm event closure. Please try again shortly.",
    };
  }
}
