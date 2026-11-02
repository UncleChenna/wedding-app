import { z } from "zod";
export const adminEmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email().max(254))
  .refine((email) => !email.includes("*"), "Use an exact email address");
export function parseAdminEmails(value: string): string[] {
  return value.trim()
    ? [...new Set(value.split(",").map((email) => adminEmailSchema.parse(email)))]
    : [];
}
export function isAdminEmail(value: unknown, allowed: readonly string[]): boolean {
  const result = adminEmailSchema.safeParse(value);
  return result.success && allowed.includes(result.data);
}
