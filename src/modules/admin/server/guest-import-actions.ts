"use server";
import "server-only";
import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { db } from "@/modules/shared/server/db/client";
import { createLogger } from "@/modules/shared/lib/logger";
import type { ImportPreviewResult, ImportCommitResult } from "../lib/guest-import";
import { withCurrentAdminAccess } from "./current-admin-access";
import { previewGuestImport, commitGuestImport } from "./guest-import";

export async function previewGuestImportAction(csv: string): Promise<ImportPreviewResult> {
  try {
    const result = await withCurrentAdminAccess((actor) => previewGuestImport(db, csv, actor));
    return result.ok ? result.value : { status: "error", message: result.message, errors: [] };
  } catch (error) {
    unstable_rethrow(error);
    createLogger({ module: "guest-import" }).warn("Import preview unavailable");
    return {
      status: "error",
      message: "We couldn't prepare the preview. Please try again.",
      errors: [],
    };
  }
}
export async function commitGuestImportAction(input: {
  previewId: string;
  digest: string;
}): Promise<ImportCommitResult> {
  try {
    const result = await withCurrentAdminAccess((actor) => commitGuestImport(db, input, actor));
    if (!result.ok) return { status: "error", message: result.message };
    if (result.value.status === "committed") {
      revalidatePath("/admin/guests");
      revalidatePath("/admin/sharing");
      revalidatePath("/admin");
    }
    return result.value;
  } catch (error) {
    unstable_rethrow(error);
    createLogger({ module: "guest-import" }).warn("Import commit unavailable");
    return {
      status: "error",
      message: "We couldn't complete the import. Retry the same preview safely.",
    };
  }
}
