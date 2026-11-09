import "server-only";
import { unstable_rethrow } from "next/navigation";
import { logger } from "@/modules/shared/lib/logger";
import { kitchenBoardSchema, type KitchenBoard } from "../lib/station-board";

const headers = {
  "Cache-Control": "private, no-store",
  "Referrer-Policy": "no-referrer",
  "X-Robots-Tag": "noindex, nofollow",
};

type Dependencies = { authorize: () => Promise<boolean>; load: () => Promise<KitchenBoard> };

/** GET /api/kitchen/board: what the board refetches on load, on every rejoin and on each notice. */
export async function kitchenBoardResponse(deps: Dependencies): Promise<Response> {
  try {
    if (!(await deps.authorize()))
      return Response.json({ error: "Kitchen sign-in required." }, { status: 403, headers });
    // The response is checked against the kitchen contract, so no extra field leaks out.
    return Response.json(kitchenBoardSchema.parse(await deps.load()), { headers });
  } catch (error) {
    unstable_rethrow(error);
  }
  logger.child({ module: "kitchen-board" }).warn("Kitchen board unavailable");
  return Response.json({ error: "Orders couldn't load. Trying again." }, { status: 503, headers });
}
