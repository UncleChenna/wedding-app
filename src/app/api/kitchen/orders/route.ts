import { postStaffOrder } from "@/modules/ordering/server/staff-order-route";

export async function POST(request: Request) {
  return postStaffOrder("kitchen", request);
}
