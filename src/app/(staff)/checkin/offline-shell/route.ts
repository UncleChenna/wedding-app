import { scannerShellResponse } from "@/modules/checkin/server/scanner-shell-response";
import { getStoredActiveThemes } from "@/modules/theming/server/active-themes";

export async function GET() {
  return scannerShellResponse(getStoredActiveThemes);
}
