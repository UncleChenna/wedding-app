"use server";
import "server-only";
import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { db } from "@/modules/shared/server/db/client";
import { createLogger } from "@/modules/shared/lib/logger";
import { currentAdminAccess } from "./current-admin-access";
import {
  assignSeatingTable,
  deleteSeatingTable,
  saveSeatingTable,
  type SeatingMutation,
} from "./seating-repository";

async function mutate(operation: () => Promise<SeatingMutation>): Promise<SeatingMutation> {
  try {
    if ((await currentAdminAccess()).status !== "ready")
      return { ok: false, message: "Please complete two-step sign-in first." };
    const result = await operation();
    if (result.ok) {
      revalidatePath("/admin/guests/seating");
      revalidatePath("/admin/guests");
      revalidatePath("/admin");
      revalidatePath("/p/[pass]", "page");
    }
    return result;
  } catch (error) {
    unstable_rethrow(error);
    createLogger({ module: "seating" }).warn("Seating mutation unavailable");
    return {
      ok: false,
      message: "Your seating change couldn't be saved. Please try again shortly.",
    };
  }
}
export async function saveTableAction(input: unknown) {
  return mutate(() => saveSeatingTable(db, input));
}
export async function deleteTableAction(input: unknown) {
  return mutate(() => deleteSeatingTable(db, input));
}
export async function assignTableAction(input: unknown) {
  return mutate(() => assignSeatingTable(db, input));
}
