import "server-only";
import { unstable_rethrow } from "next/navigation";
import { logger } from "@/modules/shared/lib/logger";
import type { BoardStation } from "../lib/station-board";
import { ticketMoveSchema, type TicketMove, type TicketMoveResult } from "../lib/ticket-status";
import type { BoardActor } from "./move-ticket";

const headers = {
  "Cache-Control": "private, no-store",
  "Referrer-Policy": "no-referrer",
  "X-Robots-Tag": "noindex, nofollow",
};

type Dependencies = {
  authorize: () => Promise<BoardActor | null>;
  move: (actor: BoardActor, move: TicketMove) => Promise<TicketMoveResult>;
};

const refused = {
  stale: { code: 409, error: "Someone else updated this order. The board is refreshing." },
  illegal: { code: 409, error: "That order can't move that way." },
  not_found: { code: 404, error: "That order isn't on this board any more." },
} as const;

/** POST /api/<station>/tickets: move one ticket. */
export async function moveTicketResponse(
  station: BoardStation,
  request: Request,
  deps: Dependencies,
): Promise<Response> {
  try {
    const actor = await deps.authorize();
    if (!actor || actor.station !== station)
      return Response.json({ error: "Sign-in required." }, { status: 403, headers });
    let body: unknown = null;
    try {
      body = await request.json();
    } catch {
      body = null;
    }
    const parsed = ticketMoveSchema.safeParse(body);
    if (!parsed.success)
      return Response.json(
        { error: "Add a short reason to cancel, then try again." },
        { status: 400, headers },
      );
    const result = await deps.move(actor, parsed.data);
    if (result.status === "moved") return Response.json(result, { headers });
    const { code, error } = refused[result.status];
    return Response.json({ ...result, error }, { status: code, headers });
  } catch (error) {
    unstable_rethrow(error);
  }
  logger.child({ module: "station-board" }).warn("Ticket move unavailable", { station });
  return Response.json(
    { error: "That didn't save. Check the connection and try again." },
    { status: 503, headers },
  );
}
