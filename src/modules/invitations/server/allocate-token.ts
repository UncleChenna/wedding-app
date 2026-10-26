import "server-only";

import { generateInvitationToken } from "../lib/token";

/** The insert must atomically reserve the token; null means a unique-token collision only. */
export async function allocateInvitationToken<T>(
  insert: (token: string) => Promise<T | null>,
): Promise<{ ok: true; value: T } | { ok: false; code: "token_exhausted" }> {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const value = await insert(generateInvitationToken());
    if (value !== null) return { ok: true, value };
  }
  return { ok: false, code: "token_exhausted" };
}
