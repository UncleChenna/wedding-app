import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { clientEnv } from "../../lib/env/client";

/**
 * Supabase client for Server Components and Server Actions, bound to the
 * request's auth cookies. Use for Auth; use Drizzle (`db`) for data.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerClient(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (toSet) => {
          try {
            for (const { name, value, options } of toSet) cookieStore.set(name, value, options);
          } catch {
            // Called from a Server Component, where cookies are read-only. Session
            // refresh happens in a Server Action or Route Handler instead.
          }
        },
      },
    },
  );
}
