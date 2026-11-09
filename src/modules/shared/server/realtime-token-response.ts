import "server-only";
import { unstable_rethrow } from "next/navigation";
import type { RealtimeToken, Station } from "../lib/realtime-channels";
import { logger } from "../lib/logger";

const headers = {
  "Cache-Control": "private, no-store",
  "Referrer-Policy": "no-referrer",
  "X-Robots-Tag": "noindex, nofollow",
};

type Dependencies = {
  /** The device id when a live, signed-in session for this station exists. */
  authorize: () => Promise<string | null>;
  secret: string;
  mint: (claims: { station: Station; deviceId: string }, secret: string) => RealtimeToken;
};

/** POST /api/<station>/realtime-token. Guests and other stations get nothing. */
export async function realtimeTokenResponse(station: Station, deps: Dependencies) {
  try {
    const deviceId = await deps.authorize();
    if (!deviceId) return Response.json({ error: "Sign-in required." }, { status: 403, headers });
    if (!deps.secret)
      return Response.json({ error: "Live updates are off." }, { status: 503, headers });
    return Response.json(deps.mint({ station, deviceId }, deps.secret), { headers });
  } catch (error) {
    unstable_rethrow(error);
  }
  logger.child({ module: "realtime" }).warn("Realtime token unavailable", { station });
  return Response.json({ error: "Live updates are paused." }, { status: 503, headers });
}
