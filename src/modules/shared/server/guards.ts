import "server-only";
import { unstable_rethrow } from "next/navigation";
import { createLogger } from "../lib/logger";
import type { StaffRole } from "./staff-auth";
import { currentStaff } from "./staff-cookies";
import type { StaffSessionIdentity } from "./staff-session";

export type AuthorizedResult<T> = { ok: true; value: T } | { ok: false; message: string };

/** Call inside every privileged staff action/handler, before reading or changing station data. */
export async function withStaffAccess<T>(
  role: StaffRole,
  operation: (identity: StaffSessionIdentity) => Promise<T>,
): Promise<AuthorizedResult<T>> {
  let identity: StaffSessionIdentity | null;
  try {
    identity = await currentStaff(role);
  } catch (error) {
    unstable_rethrow(error);
    createLogger({ module: "staff-access" }).warn("staff operation identity unavailable");
    return { ok: false, message: "Please sign in to this station again." };
  }
  if (!identity || identity.role !== role) {
    return { ok: false, message: "Please sign in to this station again." };
  }
  return { ok: true, value: await operation(identity) };
}
