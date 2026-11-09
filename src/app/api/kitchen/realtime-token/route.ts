import { postRealtimeToken } from "@/modules/shared/server/realtime-token-route";

export async function POST() {
  return postRealtimeToken("kitchen");
}
