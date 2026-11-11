import "server-only";
import { unstable_rethrow } from "next/navigation";
import { createLogger } from "@/modules/shared/lib/logger";
import { guestSnapshotSchema } from "../lib/guest-snapshot";
import type { SnapshotAuthority } from "../browser/guest-snapshot-store";

const headers = {
  "Cache-Control": "private, no-store, max-age=0",
  "Referrer-Policy": "no-referrer",
  "X-Robots-Tag": "noindex, noarchive",
};
const refuse = (status: number) =>
  Response.json({ state: status === 401 ? "denied" : "unavailable" }, { status, headers });

/** Recheck the same live credential after the consistent database projection finishes. */
export async function guestSnapshotResponse(deps: {
  authorize: () => Promise<SnapshotAuthority | null>;
  load: () => Promise<unknown>;
}): Promise<Response> {
  try {
    const initial = await deps.authorize();
    if (!initial || initial.expiresAt <= Date.now()) return refuse(401);
    const generatedAt = Date.now();
    const projection = await deps.load();
    const current = await deps.authorize();
    if (
      !current ||
      current.session !== initial.session ||
      Math.min(current.expiresAt, initial.expiresAt) <= Date.now()
    )
      return refuse(401);
    if (typeof projection !== "object" || projection === null || Array.isArray(projection))
      return refuse(503);
    // Spreading the explicit projection preserves unknown fields for strict rejection.
    const parsed = guestSnapshotSchema.safeParse({
      ...projection,
      version: 1,
      session: initial.session,
      generatedAt,
      expiresAt: Math.min(initial.expiresAt, current.expiresAt),
    });
    if (!parsed.success) return refuse(503);
    const body = JSON.stringify(parsed.data);
    if (new TextEncoder().encode(body).byteLength > 2_097_152) return refuse(503);
    return new Response(body, {
      headers: { ...headers, "Content-Type": "application/json", "X-Wedding-Guest-Snapshot": "1" },
    });
  } catch (error) {
    unstable_rethrow(error);
  }
  createLogger({ module: "guest-snapshot" }).warn("guest snapshot unavailable");
  return refuse(503);
}
