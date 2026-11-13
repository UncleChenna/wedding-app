import { postHostServe } from "@/modules/ordering/server/host-routes";

export async function POST(request: Request) {
  return postHostServe(request);
}
