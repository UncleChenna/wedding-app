import { parseClientEnv } from "./schema";

/**
 * Public env, safe for the browser. Each variable is referenced literally so
 * Next.js can inline it at build time.
 */
export const clientEnv = parseClientEnv({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
});
