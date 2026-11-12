import { postTicketMove } from "@/modules/ordering/server/move-ticket-route";

export async function POST(request: Request) {
  return postTicketMove("kitchen", request);
}
