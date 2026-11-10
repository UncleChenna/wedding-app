import "server-only";
import { unstable_rethrow } from "next/navigation";
import { logger } from "@/modules/shared/lib/logger";
import { boardSchemas, type BoardStation, type StationBoard } from "../lib/station-board";

const headers = {
  "Cache-Control": "private, no-store",
  "Referrer-Policy": "no-referrer",
  "X-Robots-Tag": "noindex, nofollow",
};

type Dependencies = { authorize: () => Promise<boolean>; load: () => Promise<StationBoard> };

const signIn = { kitchen: "Kitchen sign-in required.", bar: "Bar sign-in required." } as const;

/**
 * GET /api/<station>/board: what a board refetches on load, on every rejoin and on each notice.
 * The response is checked against that station's contract, so the bar can never be sent a
 * dietary note and neither board gets a field outside its contract.
 */
export async function stationBoardResponse(
  station: BoardStation,
  deps: Dependencies,
): Promise<Response> {
  try {
    if (!(await deps.authorize()))
      return Response.json({ error: signIn[station] }, { status: 403, headers });
    return Response.json(boardSchemas[station].parse(await deps.load()), { headers });
  } catch (error) {
    unstable_rethrow(error);
  }
  logger.child({ module: "station-board" }).warn("Station board unavailable", { station });
  return Response.json({ error: "Orders couldn't load. Trying again." }, { status: 503, headers });
}

export function kitchenBoardResponse(deps: Dependencies) {
  return stationBoardResponse("kitchen", deps);
}
