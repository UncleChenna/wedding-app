"use server";
import "server-only";
import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import { db } from "@/modules/shared/server/db/client";
import { createLogger } from "@/modules/shared/lib/logger";
import { parseInvitationEditorForm, type InvitationEditorState } from "../lib/invitation-editor";
import { withCurrentAdminAccess } from "./current-admin-access";
import { deleteAdminDraft, saveAdminInvitation } from "./invitation-editor";

const messages = {
  missing: "This invitation is no longer available. Go back to the guest list.",
  conflict:
    "This invitation or its reply changed while you were editing. Reload before saving again.",
  invalid: "Please check the invitation details and try again.",
  table_missing: "That table is no longer available. Choose another table.",
  capacity: "Keep enough tag-along places for the guests already named on this invitation.",
  admitted: "The party cannot be smaller than the number of people already admitted.",
  historical_admission:
    "A guest with a historical check-in cannot be removed. Keep the guest and correct their details instead.",
  not_draft:
    "Only an untouched draft can be deleted. Revoke this invitation instead to preserve its history.",
};
async function guarded(
  run: (actorId: string) => Promise<InvitationEditorState>,
): Promise<InvitationEditorState> {
  try {
    const result = await withCurrentAdminAccess(run);
    if (!result.ok) return { status: "error", message: result.message };
    if (result.value.status === "saved" || result.value.status === "deleted") {
      revalidatePath("/admin/guests");
      revalidatePath("/admin/sharing");
      if (result.value.status === "saved") revalidatePath(`/admin/guests/${result.value.id}/edit`);
    }
    return result.value;
  } catch (error) {
    unstable_rethrow(error);
    createLogger({ module: "admin-invitation-editor" }).warn("Invitation change unavailable");
    return { status: "error", message: "We couldn't save this change. Please try again." };
  }
}
export async function saveInvitationEditorAction(
  _previous: InvitationEditorState,
  form: FormData,
): Promise<InvitationEditorState> {
  return guarded(async (actorId) => {
    const parsed = parseInvitationEditorForm(form);
    if (!parsed.success)
      return {
        status: "error",
        message: "Please check the highlighted fields.",
        fields: Object.fromEntries(
          parsed.error.issues.map((issue) => [issue.path.join("."), issue.message]),
        ),
      };
    const id = form.get("id");
    const snapshot = form.get("snapshot");
    if (id !== null && (typeof id !== "string" || typeof snapshot !== "string"))
      return { status: "error", message: messages.invalid };
    const edit =
      typeof id === "string" && typeof snapshot === "string" ? { id, snapshot } : undefined;
    const result = await saveAdminInvitation(db, parsed.data, actorId, edit);
    if (!result.ok) return { status: "error", message: messages[result.code] };
    return {
      status: "saved",
      message: edit
        ? "Invitation details saved."
        : "Draft invitation created. Review the details before sharing it.",
      id: result.id,
      snapshot: result.snapshot,
      values: result.values,
    };
  });
}
export async function deleteInvitationDraftAction(
  _previous: InvitationEditorState,
  form: FormData,
): Promise<InvitationEditorState> {
  const result = await guarded(async () => {
    const id = form.get("id");
    const snapshot = form.get("snapshot");
    if (
      typeof id !== "string" ||
      typeof snapshot !== "string" ||
      form.get("confirmation") !== "delete"
    )
      return { status: "error", message: "Confirm that you want to delete this draft." };
    const result = await deleteAdminDraft(db, id, snapshot);
    return result.ok
      ? { status: "deleted", message: "Draft invitation deleted." }
      : { status: "error", message: messages[result.code] };
  });
  if (result.status === "deleted") redirect("/admin/guests?notice=draft-deleted");
  return result;
}
