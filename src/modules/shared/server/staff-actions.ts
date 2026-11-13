"use server";
import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createLogger } from "../lib/logger";
import { staffSignInMessages, type StaffSignInState } from "../lib/staff-sign-in-state";
import { signInStaff, staffRoleSchema } from "./staff-auth";
import { createStaffDeviceCookie, readStaffDeviceCookie } from "./staff-device-cookie";
import {
  STAFF_DEVICE_COOKIE,
  STAFF_SESSION_COOKIE,
  staffCookieOptions,
  staffSigningKey,
} from "./staff-cookies";
import { signStaffSession } from "./staff-session";
import { actionRateLimit } from "./request-rate-limit";

const log = createLogger({ module: "staff-auth" });
const formSchema = z.object({ role: staffRoleSchema, pin: z.string().max(100) });
const destinations = { gate: "/checkin", kitchen: "/kitchen", bar: "/bar", host: "/host" } as const;

export async function staffSignInAction(
  _previous: StaffSignInState,
  form: FormData,
): Promise<StaffSignInState> {
  try {
    const budget = await actionRateLimit("pin");
    if (budget.status !== "allowed")
      return {
        status: budget.status === "limited" ? "locked" : "unavailable",
        message: budget.message,
      };
    const parsed = formSchema.safeParse({ role: form.get("role"), pin: form.get("pin") });
    if (!parsed.success) return { status: "wrong", message: staffSignInMessages.wrong };
    const key = staffSigningKey();
    if (!key) return { status: "unavailable", message: staffSignInMessages.unavailable };
    const jar = await cookies();
    let device = readStaffDeviceCookie(jar.get(STAFF_DEVICE_COOKIE)?.value ?? "", key);
    if (!device) {
      const created = createStaffDeviceCookie(key);
      device = created.id;
      jar.set(STAFF_DEVICE_COOKIE, created.cookie, {
        ...staffCookieOptions,
        maxAge: 60 * 60 * 24 * 90,
      });
    }
    const result = await signInStaff(parsed.data.pin, parsed.data.role, device);
    if (result.status !== "success")
      return { status: result.status, message: staffSignInMessages[result.status] };
    const { expiresAt, ...identity } = result.value;
    jar.set(STAFF_SESSION_COOKIE, signStaffSession(identity, device, expiresAt, key), {
      ...staffCookieOptions,
      expires: expiresAt,
    });
  } catch {
    // Do not serialize database exceptions: query parameters may contain credentials.
    log.warn("staff sign-in unavailable");
    return { status: "unavailable", message: staffSignInMessages.unavailable };
  }
  const role = staffRoleSchema.parse(form.get("role"));
  redirect(destinations[role]);
}

/** Enhanced scanner logout clears offline access again after this response applies the cookie. */
export async function clearStaffSessionAction(): Promise<void> {
  const jar = await cookies();
  jar.delete(STAFF_SESSION_COOKIE);
  // Keep the device identity and its attempt counter: sign-out must not reset lockout.
}

export async function staffSignOutAction(): Promise<void> {
  await clearStaffSessionAction();
  redirect("/staff");
}
