import "server-only";
import { unstable_rethrow } from "next/navigation";
import { logger } from "@/modules/shared/lib/logger";
import { db } from "@/modules/shared/server/db/client";
import { readBoundedJson } from "@/modules/shared/server/bounded-json";
import { currentStaffDevice } from "@/modules/shared/server/staff-cookies";
import {
  hostBoardSchema,
  hostServeSchema,
  type HostBoard,
  type HostServe,
} from "../lib/host-board";
import type { TicketMoveResult } from "../lib/ticket-status";
import { readHostBoard } from "./host-board";
import { serveHostTicket, type HostActor } from "./host-serve";

const headers = {
  "Cache-Control": "private, no-store",
  "Referrer-Policy": "no-referrer",
  "X-Robots-Tag": "noindex, nofollow",
};
const log = logger.child({ module: "host-board" });

type Authorize = () => Promise<HostActor | null>;

async function liveHost(): Promise<HostActor | null> {
  const current = await currentStaffDevice("host");
  return current ? { staffId: current.identity.staffId, deviceId: current.device.id } : null;
}

/** GET /api/host/board: the signed-in host's tables and their open orders. */
export async function hostBoardResponse(deps: {
  authorize: Authorize;
  load: (staffId: string) => Promise<HostBoard>;
}): Promise<Response> {
  try {
    const actor = await deps.authorize();
    if (!actor) return Response.json({ error: "Host sign-in required." }, { status: 403, headers });
    return Response.json(hostBoardSchema.parse(await deps.load(actor.staffId)), { headers });
  } catch (error) {
    unstable_rethrow(error);
  }
  log.warn("Host board unavailable");
  return Response.json({ error: "Orders couldn't load. Trying again." }, { status: 503, headers });
}

const refused = {
  stale: { code: 409, error: "The kitchen or bar already updated this order." },
  illegal: { code: 409, error: "That order can't be marked served." },
  not_found: { code: 404, error: "That order isn't on your tables." },
} as const;

/** POST /api/host/tickets: mark one of the host's tickets served. */
export async function hostServeResponse(
  request: Request,
  deps: {
    authorize: Authorize;
    serve: (actor: HostActor, serve: HostServe) => Promise<TicketMoveResult>;
  },
): Promise<Response> {
  try {
    const actor = await deps.authorize();
    if (!actor) return Response.json({ error: "Sign-in required." }, { status: 403, headers });
    if (request.headers.get("origin") !== new URL(request.url).origin)
      return Response.json({ error: "Update orders from your board." }, { status: 403, headers });
    const body = await readBoundedJson(request, 1024);
    const parsed = hostServeSchema.safeParse(body.status === "valid" ? body.value : null);
    if (!parsed.success)
      return Response.json(
        { error: "That order can't be marked served." },
        { status: 400, headers },
      );
    const result = await deps.serve(actor, parsed.data);
    if (result.status === "moved") return Response.json(result, { headers });
    const { code, error } = refused[result.status];
    return Response.json({ ...result, error }, { status: code, headers });
  } catch (error) {
    unstable_rethrow(error);
  }
  log.warn("Host serve unavailable");
  return Response.json(
    { error: "That didn't save. Check the connection and try again." },
    { status: 503, headers },
  );
}

export function getHostBoard() {
  return hostBoardResponse({ authorize: liveHost, load: (staffId) => readHostBoard(db, staffId) });
}

export function postHostServe(request: Request) {
  return hostServeResponse(request, {
    authorize: liveHost,
    serve: (actor, serve) => serveHostTicket(db, actor, serve),
  });
}
