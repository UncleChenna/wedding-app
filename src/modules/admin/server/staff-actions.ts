"use server";
import "server-only";
import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { z } from "zod";
import { createLogger } from "@/modules/shared/lib/logger";
import { appRoutes } from "@/modules/shared/lib/routes";
import { db } from "@/modules/shared/server/db/client";
import { getEventSettings } from "@/modules/shared/server/settings";
import { newStaffSchema, staffCopy, type PinState, type StaffFormState } from "../lib/staff";
import { formatStaffExpiry } from "../lib/staff-time";
import { withCurrentAdminAccess } from "./current-admin-access";
import { addStaff, issueStaffPin, revokeStaff, setAlertContact } from "./staff-repository";
import { alertContactSchema, alertCopy, type AlertContactState } from "../lib/staff-alerts";

const log = createLogger({ module: "admin-staff" });
const idSchema = z.uuid();

/** Each action checks admin access itself. A PIN is never logged or stored, only returned once. */
export async function addStaffAction(
  _previous: StaffFormState,
  form: FormData,
): Promise<StaffFormState> {
  const parsed = newStaffSchema.safeParse({
    name: form.get("name") ?? "",
    role: form.get("role") ?? "",
  });
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return {
      status: "error",
      message: "Please check the highlighted field.",
      fieldMessage: issue?.message ?? staffCopy.failed,
      field: issue?.path[0] === "role" ? "role" : "name",
    };
  }
  try {
    const result = await withCurrentAdminAccess(() =>
      addStaff(db, parsed.data.name, parsed.data.role),
    );
    if (!result.ok) return { status: "error", message: result.message };
    revalidatePath(appRoutes.adminStaff.path);
    return { status: "saved", message: staffCopy.added };
  } catch (error) {
    unstable_rethrow(error);
    log.warn("staff add failed");
    return { status: "error", message: staffCopy.failed };
  }
}

export async function issuePinAction(_previous: PinState, form: FormData): Promise<PinState> {
  const id = idSchema.safeParse(form.get("id"));
  const name = z.string().max(80).safeParse(form.get("name"));
  if (!id.success) return { status: "error", message: staffCopy.missing };
  try {
    const result = await withCurrentAdminAccess(() => issueStaffPin(db, id.data));
    if (!result.ok) return { status: "error", message: result.message };
    const issued = result.value;
    revalidatePath(appRoutes.adminStaff.path);
    if (issued.status === "issued") {
      const { timeZone } = await getEventSettings();
      return {
        status: "issued",
        pin: issued.pin,
        name: name.success ? name.data : "",
        until: formatStaffExpiry(issued.expiresAt, timeZone),
      };
    }
    const messages = {
      "no-time-zone": staffCopy.noTimeZone,
      "event-over": staffCopy.eventOver,
      missing: staffCopy.missing,
      "no-unique-pin": staffCopy.noUniquePin,
    } as const;
    return { status: "error", message: messages[issued.status] };
  } catch (error) {
    unstable_rethrow(error);
    log.warn("staff PIN issue failed");
    return { status: "error", message: staffCopy.failed };
  }
}

export async function revokeStaffAction(_previous: PinState, form: FormData): Promise<PinState> {
  const id = idSchema.safeParse(form.get("id"));
  if (!id.success) return { status: "error", message: staffCopy.missing };
  try {
    const result = await withCurrentAdminAccess(() => revokeStaff(db, id.data));
    if (!result.ok) return { status: "error", message: result.message };
    if (!result.value) return { status: "error", message: staffCopy.missing };
    revalidatePath(appRoutes.adminStaff.path);
    return { status: "revoked", message: staffCopy.removedNow };
  } catch (error) {
    unstable_rethrow(error);
    log.warn("staff revoke failed");
    return { status: "error", message: staffCopy.failed };
  }
}

/** Saves a station person's WhatsApp number and alert opt-in (TICKET-086). Numbers are never logged. */
export async function saveAlertContactAction(
  _previous: AlertContactState,
  form: FormData,
): Promise<AlertContactState> {
  const typed = { number: String(form.get("number") ?? ""), optIn: form.get("optIn") === "on" };
  const parsed = alertContactSchema.safeParse({ id: form.get("id") ?? "", ...typed });
  if (!parsed.success) {
    const issue = parsed.error.issues.find((item) => item.path[0] === "number");
    if (!issue) return { status: "error", message: alertCopy.missing, ...typed };
    return { status: "error", message: alertCopy.check, fieldMessage: issue.message, ...typed };
  }
  try {
    const result = await withCurrentAdminAccess(() =>
      setAlertContact(db, parsed.data.id, parsed.data),
    );
    if (!result.ok) return { status: "error", message: result.message, ...typed };
    if (!result.value) return { status: "error", message: alertCopy.missing, ...typed };
    revalidatePath(appRoutes.adminStaff.path);
    return { status: "saved", message: parsed.data.optIn ? alertCopy.savedOn : alertCopy.savedOff };
  } catch (error) {
    unstable_rethrow(error);
    log.warn("staff alert contact save failed");
    return { status: "error", message: alertCopy.failed, ...typed };
  }
}
