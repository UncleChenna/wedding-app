import "server-only";
import { readBoundedJson } from "@/modules/shared/server/bounded-json";
import { z } from "zod";
import { unstable_rethrow } from "next/navigation";
import { logger } from "@/modules/shared/lib/logger";
import { scanReadResultSchema, type ScanReadResult } from "../lib/scan-read-result";
const input = z.strictObject({
  qr: z.string().min(1).max(4096),
  reportedAt: z.iso.datetime().optional(),
});
const headers = {
  "Cache-Control": "private, no-store",
  "Referrer-Policy": "no-referrer",
  "X-Robots-Tag": "noindex, nofollow",
};
type Dependencies = {
  authorize: () => Promise<boolean>;
  read: (qr: string, origin: string, reportedAt: Date) => Promise<ScanReadResult>;
};
/** Authenticated observation; never admits or logs raw credentials. */
export async function scanReadResponse(request: Request, deps: Dependencies): Promise<Response> {
  try {
    if (!(await deps.authorize()))
      return Response.json({ state: "session_expired" }, { status: 403, headers });
    const origin = new URL(request.url).origin;
    if (request.headers.get("origin") !== origin)
      return Response.json({ state: "invalid" }, { status: 403, headers });
    const data = await readBoundedJson(request, 8192);
    if (data.status !== "valid")
      return Response.json({ state: "invalid" }, { status: 400, headers });
    const parsed = input.safeParse(data.value);
    if (!parsed.success) return Response.json({ state: "invalid" }, { status: 400, headers });
    const now = Date.now();
    const reportedAt = new Date(parsed.data.reportedAt ?? now);
    if (reportedAt.getTime() < now - 86_400_000 || reportedAt.getTime() > now + 300_000)
      return Response.json({ state: "invalid" }, { status: 400, headers });
    const result = scanReadResultSchema.safeParse(
      await deps.read(parsed.data.qr, origin, reportedAt),
    );
    if (result.success) return Response.json(result.data, { headers });
  } catch (error) {
    unstable_rethrow(error);
  }
  logger.child({ module: "scan-read" }).warn("Pass check unavailable");
  return Response.json({ state: "unavailable" }, { status: 503, headers });
}
