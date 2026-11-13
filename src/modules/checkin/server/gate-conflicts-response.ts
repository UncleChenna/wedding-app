import "server-only";
import { unstable_rethrow } from "next/navigation";
import { createLogger } from "@/modules/shared/lib/logger";
import { gateConflictsSchema } from "../lib/gate-conflicts";
const headers = {
  "Cache-Control": "private, no-store, max-age=0",
  "X-Robots-Tag": "noindex, noarchive",
  "Referrer-Policy": "no-referrer",
};
const refuse = (status: number) =>
  Response.json({ state: status === 401 ? "denied" : "unavailable" }, { status, headers });
export async function gateConflictsResponse(deps: {
  authorize: () => Promise<{ session: string; expiresAt: number } | null>;
  load: () => Promise<unknown>;
}) {
  try {
    const first = await deps.authorize();
    if (!first || first.expiresAt <= Date.now()) return refuse(401);
    const entries = await deps.load();
    const current = await deps.authorize();
    if (
      !current ||
      current.session !== first.session ||
      Math.min(current.expiresAt, first.expiresAt) <= Date.now()
    )
      return refuse(401);
    const parsed = gateConflictsSchema.safeParse({
      session: first.session,
      expiresAt: Math.min(current.expiresAt, first.expiresAt),
      entries,
    });
    if (!parsed.success) return refuse(503);
    return Response.json(parsed.data, { headers });
  } catch (error) {
    unstable_rethrow(error);
  }
  createLogger({ module: "gate-conflicts" }).warn("Gate conflict list unavailable");
  return refuse(503);
}
