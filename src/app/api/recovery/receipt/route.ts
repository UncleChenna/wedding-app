import { recoveryReceiptResponse } from "@/modules/checkin/server/recovery-response";
import { staffSigningKey } from "@/modules/shared/server/staff-cookies";
export function POST(request: Request) {
  return recoveryReceiptResponse(request, staffSigningKey());
}
