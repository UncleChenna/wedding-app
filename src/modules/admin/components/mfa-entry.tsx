import { appRoutes } from "@/modules/shared/lib/routes";
import { redirect } from "next/navigation";
import { requireAdminPageAccess } from "../server/current-admin-access";

/** Keep old bookmarks working while authenticator sign-in is deferred. */
export async function MfaEntry() {
  await requireAdminPageAccess();
  return redirect(appRoutes.admin.path);
}
