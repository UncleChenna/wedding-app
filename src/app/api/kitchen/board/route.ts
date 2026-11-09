import { getKitchenBoardResponse } from "@/modules/ordering/server/kitchen-board";

export async function GET() {
  return getKitchenBoardResponse();
}
