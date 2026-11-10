import "server-only";
import { unstable_rethrow } from "next/navigation";
import { createLogger } from "@/modules/shared/lib/logger";
import { dashboardSnapshotSchema } from "../lib/dashboard";
import type { AdminAccess } from "./admin-access";

const headers = {
  "Cache-Control": "private, no-store, max-age=0",
  "X-Content-Type-Options": "nosniff",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
};

/** Every poll rechecks live authorization before reading any aggregate. */
export async function dashboardResponse(
  access: () => Promise<AdminAccess>,
  read: () => Promise<unknown>,
) {
  try {
    if ((await access()).status !== "ready")
      return Response.json(
        { message: "Please sign in again to view your dashboard." },
        { status: 403, headers },
      );
    return Response.json(dashboardSnapshotSchema.parse(await read()), { headers });
  } catch (error) {
    unstable_rethrow(error);
    createLogger({ module: "admin-dashboard" }).warn("Dashboard counts unavailable");
    return Response.json(
      { message: "Your counts couldn’t refresh. Please try again shortly." },
      { status: 503, headers },
    );
  }
}
