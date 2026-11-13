import { getHostBoard } from "@/modules/ordering/server/host-routes";

export async function GET() {
  return getHostBoard();
}
