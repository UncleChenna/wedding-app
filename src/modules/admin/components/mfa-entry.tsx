import { appRoutes } from "@/modules/shared/lib/routes";
import { redirect } from "next/navigation";
import { currentAdminAccess } from "../server/current-admin-access";
import { MfaForm } from "./mfa-form";
export async function MfaEntry() {
  const access = await currentAdminAccess();
  if (access.status === "signed-out" || access.status === "denied")
    redirect(appRoutes.adminSignIn.path);
  if (access.status === "ready") redirect(appRoutes.admin.path);
  const factorId =
    access.status === "challenge"
      ? access.factors.find((factor) => factor.status === "verified")?.id
      : undefined;
  return <MfaForm factorId={factorId} />;
}
