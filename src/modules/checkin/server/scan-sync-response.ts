import "server-only";
import { unstable_rethrow } from "next/navigation";
import { logger } from "@/modules/shared/lib/logger";
import { scanSyncBatchSchema, type ScanEventAck, type ScanEventReport } from "../lib/scan-sync";
import type { GateActor } from "./reconcile-scans";

const headers = {
  "Cache-Control": "private, no-store",
  "Referrer-Policy": "no-referrer",
  "X-Robots-Tag": "noindex, nofollow",
};
/** 200 events of about 250 bytes each, with room to spare. */
const MAX_BODY_BYTES = 128 * 1024;

type Dependencies = {
  authorize: () => Promise<GateActor | null>;
  reconcile: (
    actor: GateActor,
    events: readonly ScanEventReport[],
  ) => Promise<{ acks: ScanEventAck[]; revoked: boolean }>;
};

/** POST /api/checkin/sync: a gate device uploads the scans it made offline (TICKET-173). */
export async function scanSyncResponse(request: Request, deps: Dependencies): Promise<Response> {
  try {
    const actor = await deps.authorize();
    if (!actor) return Response.json({ error: "Gate sign-in required." }, { status: 403, headers });

    const text = await request.text();
    if (new TextEncoder().encode(text).byteLength > MAX_BODY_BYTES)
      return Response.json({ error: "Send fewer scans at a time." }, { status: 413, headers });
    let body: unknown;
    try {
      body = JSON.parse(text);
    } catch {
      body = null;
    }
    const parsed = scanSyncBatchSchema.safeParse(body);
    if (!parsed.success)
      return Response.json({ error: "These scans could not be read." }, { status: 400, headers });
    const ids = new Set(parsed.data.events.map((event) => event.clientEventId));
    if (ids.size !== parsed.data.events.length)
      return Response.json({ error: "These scans could not be read." }, { status: 400, headers });

    const { acks, revoked } = await deps.reconcile(actor, parsed.data.events);
    // Stored scans stay acknowledged; the rest wait on the device for a signed-in upload.
    return Response.json({ acks, signedOut: revoked }, { status: 200, headers });
  } catch (error) {
    unstable_rethrow(error);
  }
  logger.child({ module: "checkin-sync" }).warn("Offline scan upload unavailable");
  return Response.json(
    { error: "Scans couldn't be saved yet. They're kept on this phone." },
    { status: 503, headers },
  );
}
