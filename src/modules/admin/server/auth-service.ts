import "server-only";
import { z } from "zod";
import { adminEmailSchema, isAdminEmail } from "../lib/admin-emails";
import type { AdminAuthState } from "../lib/auth-state";

export interface AdminAuthPort {
  signInWithOtp(input: {
    email: string;
    options: { shouldCreateUser: boolean };
  }): Promise<{ error: unknown }>;
  verifyOtp(input: {
    email: string;
    token: string;
    type: "email";
  }): Promise<{ data: { user: { email?: string } | null }; error: unknown }>;
  signOut(input: { scope: "local" }): Promise<{ error: unknown }>;
}
const denied: AdminAuthState = {
  status: "error",
  message: "This email isn’t on the wedding admin list. Please check with the couple.",
};
export async function requestAdminCode(
  value: unknown,
  allowed: readonly string[],
  auth: AdminAuthPort,
): Promise<AdminAuthState> {
  const parsed = adminEmailSchema.safeParse(value);
  if (!parsed.success || !isAdminEmail(parsed.data, allowed)) return denied;
  const { error } = await auth.signInWithOtp({
    email: parsed.data,
    options: { shouldCreateUser: true },
  });
  if (error)
    return {
      status: "error",
      message: "We couldn’t send a code. Please wait a moment and try again.",
    };
  return {
    status: "code-sent",
    email: parsed.data,
    message: "Check your email for your sign-in code.",
  };
}
export async function verifyAdminCode(
  value: unknown,
  code: unknown,
  allowed: readonly string[],
  auth: AdminAuthPort,
): Promise<AdminAuthState> {
  const email = adminEmailSchema.safeParse(value);
  if (!email.success || !isAdminEmail(email.data, allowed)) return denied;
  const token = z
    .string()
    .trim()
    .regex(/^\d{6,8}$/)
    .safeParse(code);
  const failure: AdminAuthState = {
    status: "error",
    email: email.data,
    message: "That code couldn’t be verified. Try again or request a new one.",
  };
  if (!token.success) return failure;
  const { data, error } = await auth.verifyOtp({
    email: email.data,
    token: token.data,
    type: "email",
  });
  if (error) return failure;
  if (
    !data.user ||
    !isAdminEmail(data.user.email, allowed) ||
    data.user.email?.toLowerCase() !== email.data
  ) {
    await auth.signOut({ scope: "local" });
    return denied;
  }
  return { status: "signed-in", message: "You’re signed in." };
}
export async function signOutAdmin(auth: AdminAuthPort): Promise<AdminAuthState> {
  const { error } = await auth.signOut({ scope: "local" });
  return error
    ? { status: "error", message: "We couldn’t sign you out. Please try again." }
    : { status: "signed-out", message: "You’re signed out on this device." };
}
