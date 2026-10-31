import type { ReactNode } from "react";
import { requireAdminPageAccess } from "../server/current-admin-access";
export async function AdminAccessGate({ children }: { children: ReactNode }) {
  await requireAdminPageAccess();
  return children;
}
