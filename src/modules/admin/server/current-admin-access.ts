import "server-only";
import { appRoutes } from "@/modules/shared/lib/routes";
import { cache } from "react";
import { connection } from "next/server";
import { redirect, unstable_rethrow } from "next/navigation";
import { createSupabaseServerClient } from "@/modules/shared/server/supabase/server";
import { serverEnv } from "@/modules/shared/server/env";
import { createLogger } from "@/modules/shared/lib/logger";
import { parseAdminEmails } from "../lib/admin-emails";
import { readAdminAccess, type AdminAccess } from "./admin-access";
export const currentAdminAccess = cache(async (): Promise<AdminAccess> => {
  await connection();
  try {
    const client = await createSupabaseServerClient();
    return await readAdminAccess(client.auth, parseAdminEmails(serverEnv.ADMIN_EMAIL_ALLOWLIST));
  } catch (error) {
    unstable_rethrow(error);
    createLogger({ module: "admin-access" }).warn("admin identity check unavailable");
    return { status: "signed-out" };
  }
});

export async function requireAdminPageAccess() {
  const access = await currentAdminAccess();
  if (access.status === "signed-out" || access.status === "denied")
    redirect(appRoutes.adminSignIn.path);
  if (access.status !== "ready") redirect(appRoutes.adminMfa.path);
  return access;
}
