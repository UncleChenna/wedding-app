"use server";
import "server-only";
import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { createLogger } from "@/modules/shared/lib/logger";
import { appRoutes } from "@/modules/shared/lib/routes";
import { db } from "@/modules/shared/server/db/client";
import { deviceCopy, deviceIdSchema, deviceNameSchema, type DeviceFormState } from "../lib/device";
import { withCurrentAdminAccess } from "./current-admin-access";
import { renameDevice } from "./device-repository";

/** Renames a registered device. Checks admin access itself, like every admin action. */
export async function renameDeviceAction(
  _previous: DeviceFormState,
  form: FormData,
): Promise<DeviceFormState> {
  const id = deviceIdSchema.safeParse(form.get("id"));
  if (!id.success) return { status: "error", message: deviceCopy.missing };
  const name = deviceNameSchema.safeParse(form.get("name") ?? "");
  if (!name.success)
    return { status: "error", message: name.error.issues[0]?.message ?? deviceCopy.failed };
  try {
    const result = await withCurrentAdminAccess(() => renameDevice(db, id.data, name.data));
    if (!result.ok) return { status: "error", message: result.message };
    if (!result.value) return { status: "error", message: deviceCopy.missing };
    revalidatePath(appRoutes.adminStaff.path);
    return { status: "saved", message: deviceCopy.renamed };
  } catch (error) {
    unstable_rethrow(error);
    createLogger({ module: "admin-devices" }).warn("device rename failed");
    return { status: "error", message: deviceCopy.failed };
  }
}
