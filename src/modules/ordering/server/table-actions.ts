"use server";
import "server-only";
import { cookies } from "next/headers";
import { redirect, unstable_rethrow } from "next/navigation";
import type { tableErrors } from "../lib/table-selection";
import { TABLE_COOKIE, type TableFormState } from "../lib/table-selection";
import { resolveTableSelection } from "./table-selection";
import { findTable } from "./table-repository";
import { logger } from "@/modules/shared/lib/logger";

export async function selectTableAction(
  _previous: TableFormState,
  form: FormData,
): Promise<TableFormState> {
  const raw = form.get("table");
  const value = typeof raw === "string" ? raw.slice(0, 10) : "";
  const result = await resolveTableSelection(raw, findTable);
  if (result.status !== "selected") tableErrorRedirect(result.status, value);
  try {
    const store = await cookies();
    // Session convenience only, not an authorization credential. Revalidated on every read.
    store.set(TABLE_COOKIE, String(result.table.number), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/order",
    });
  } catch (error) {
    unstable_rethrow(error);
    logger.child({ module: "ordering" }).warn("Table selection could not be remembered");
    tableErrorRedirect("save", value);
  }
  redirect("/order#selected-table");
}

// POST/redirect/GET also displays errors when JavaScript is unavailable. Only a
// fixed error code and the public table number travel in the URL, never DB errors.
function tableErrorRedirect(error: keyof typeof tableErrors, value: string): never {
  const query = new URLSearchParams({ change: "1", error, table: value });
  redirect(`/order?${query}#order-table`);
}
