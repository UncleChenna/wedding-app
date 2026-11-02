import { redirect } from "next/navigation";
import { currentAdminAccess } from "../server/current-admin-access";
import { MfaForm } from "./mfa-form";
export async function MfaEntry() {
  const access = await currentAdminAccess();
  if (access.status === "signed-out" || access.status === "denied") redirect("/admin/sign-in");
  if (access.status === "ready") redirect("/admin");
  const factorId =
    access.status === "challenge"
      ? access.factors.find((factor) => factor.status === "verified")?.id
      : undefined;
  return <MfaForm factorId={factorId} />;
}
