import "server-only";
import { unstable_rethrow } from "next/navigation";
import { createLogger } from "@/modules/shared/lib/logger";
import type { AdminAccess } from "./admin-access";
import { healthSnapshotSchema } from "../lib/health";
const headers = {
  "Cache-Control": "private, no-store, max-age=0",
  "X-Content-Type-Options": "nosniff",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
};
export async function publicHealthResponse(probe: () => Promise<boolean | null>) {
  let ready = false;
  try {
    ready = (await probe()) === true;
  } catch (error) {
    unstable_rethrow(error);
  }
  return Response.json(
    { status: ready ? "ok" : "unavailable" },
    { status: ready ? 200 : 503, headers },
  );
}
export async function adminHealthResponse(
  access: () => Promise<AdminAccess>,
  read: () => Promise<unknown>,
) {
  try {
    if ((await access()).status !== "ready")
      return Response.json({ message: "Please sign in again." }, { status: 403, headers });
    return Response.json(healthSnapshotSchema.parse(await read()), { headers });
  } catch (error) {
    unstable_rethrow(error);
    createLogger({ module: "admin-health" }).warn("Health check unavailable");
    return Response.json(
      { message: "Health checks could not refresh. Please try again." },
      { status: 503, headers },
    );
  }
}
