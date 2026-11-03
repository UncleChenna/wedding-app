"use server";
import "server-only";
import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { db } from "@/modules/shared/server/db/client";
import { createLogger } from "@/modules/shared/lib/logger";
import { invitationHref } from "@/modules/shared/lib/routes";
import { invitationTokenSchema } from "../lib/token";
import type { PartyState } from "../lib/party";
import { saveParty } from "./party";

export async function updateParty(_previous: PartyState, form: FormData): Promise<PartyState> {
  try {
    const token = invitationTokenSchema.safeParse(form.get("token"));
    const raw = form.get("people");
    if (!token.success || typeof raw !== "string" || raw.length > 400_000) {
      return { status: "error", message: "Please reload your invitation and try again." };
    }
    let people: unknown;
    try {
      people = JSON.parse(raw);
    } catch {
      return { status: "error", message: "Please reload your invitation and try again." };
    }
    const result = await saveParty(db, token.data, people);
    if (result.status === "saved") revalidatePath(invitationHref(token.data));
    return result;
  } catch (error) {
    unstable_rethrow(error);
    createLogger({ module: "invitations" }).warn("Guest details save unavailable");
    return {
      status: "error",
      message: "We couldn’t save your guest details just now. Please try again.",
    };
  }
}
