import type { ReactNode } from "react";
import { getEventSettings } from "@/modules/shared/server/settings";
import { AdminShell } from "./admin-shell";

/** Server wrapper: names the event from settings, then renders the shell. Call only after access is checked. */
export async function AdminFrame({ children }: { children: ReactNode }) {
  const settings = await getEventSettings();
  return <AdminShell eventName={settings.coupleNames.join(" & ")}>{children}</AdminShell>;
}
