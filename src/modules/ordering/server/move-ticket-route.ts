import "server-only";
import { db } from "@/modules/shared/server/db/client";
import { currentStaffDevice } from "@/modules/shared/server/staff-cookies";
import type { BoardStation } from "../lib/station-board";
import { moveTicket } from "./move-ticket";
import { moveTicketResponse } from "./move-ticket-response";

/** Live staff, device, credential and event-expiry checks run before every move. */
export function postTicketMove(station: BoardStation, request: Request) {
  return moveTicketResponse(station, request, {
    authorize: async () => {
      const current = await currentStaffDevice(station);
      return current
        ? { station, staffId: current.identity.staffId, deviceId: current.device.id }
        : null;
    },
    move: (actor, move) => moveTicket(db, actor, move),
  });
}
