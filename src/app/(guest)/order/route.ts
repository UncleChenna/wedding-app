import { getPublicEventDetails } from "@/modules/invitations/server/public-event-details";
import { orderPage } from "@/modules/ordering/server/order-page";
export { selectOrderTable as POST } from "@/modules/ordering/server/order-page";

export async function GET(request: Request) {
  return orderPage(request, await getPublicEventDetails());
}
