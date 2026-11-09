import "server-only";
import { unstable_rethrow } from "next/navigation";
import { createLogger } from "@/modules/shared/lib/logger";
import { guestExportCsv, parseGuestExportFilters } from "../lib/guest-export";
import { currentAdminAccess } from "./current-admin-access";
import { readGuestExport } from "./guest-export";

const headers = {
  "Cache-Control": "private, no-store, max-age=0",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
};

export async function guestExportDownload(request: Request): Promise<Response> {
  try {
    if ((await currentAdminAccess()).status !== "ready")
      return new Response("Please complete two-step sign-in first.", { status: 403, headers });
    const filters = parseGuestExportFilters(new URL(request.url).searchParams);
    if (!filters.success)
      return new Response("Please return to Guests and choose your filters again.", {
        status: 400,
        headers,
      });
    const csv = guestExportCsv(await readGuestExport(), filters.data);
    return new Response("\uFEFF" + csv, {
      headers: {
        ...headers,
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="guest-list.csv"',
      },
    });
  } catch (error) {
    unstable_rethrow(error);
    createLogger({ module: "guest-export" }).warn("Guest export unavailable");
    return new Response("Your guest list couldn't be downloaded. Please try again shortly.", {
      status: 503,
      headers,
    });
  }
}
