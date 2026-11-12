import { postManualCheckin } from "@/modules/checkin/server/manual";

export async function POST(request: Request) {
  return postManualCheckin(request);
}
