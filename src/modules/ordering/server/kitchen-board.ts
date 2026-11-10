import "server-only";
import { db } from "@/modules/shared/server/db/client";
import { currentStaff } from "@/modules/shared/server/staff-cookies";
import { kitchenBoardResponse } from "./station-board-response";
import { readKitchenBoard } from "./station-board";

/** Live kitchen staff, device, credential and event-expiry checks run on every read. */
export function getKitchenBoardResponse() {
  return kitchenBoardResponse({
    authorize: async () => (await currentStaff("kitchen")) !== null,
    load: () => readKitchenBoard(db),
  });
}

export { readKitchenBoard };
