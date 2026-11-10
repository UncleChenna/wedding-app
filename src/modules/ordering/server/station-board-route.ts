import "server-only";
import { db } from "@/modules/shared/server/db/client";
import { currentStaff } from "@/modules/shared/server/staff-cookies";
import type { BoardStation } from "../lib/station-board";
import { stationBoardResponse } from "./station-board-response";
import { readStationBoard } from "./station-board";

/** Live staff, device, credential and event-expiry checks for this station run on every read. */
export function getStationBoardResponse(station: BoardStation) {
  return stationBoardResponse(station, {
    authorize: async () => (await currentStaff(station)) !== null,
    load: () => readStationBoard(db, station),
  });
}
