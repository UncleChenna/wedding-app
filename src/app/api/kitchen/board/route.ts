import { getStationBoardResponse } from "@/modules/ordering/server/station-board-route";

export async function GET() {
  return getStationBoardResponse("kitchen");
}
