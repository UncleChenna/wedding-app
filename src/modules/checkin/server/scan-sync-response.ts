import "server-only";
import { readBoundedJson } from "@/modules/shared/server/bounded-json";
import { unstable_rethrow } from "next/navigation";
import { logger } from "@/modules/shared/lib/logger";
import { scanSyncUploadSchema, type ScanEventAck, type ScanEventReport } from "../lib/scan-sync";
import type { AdmissionActor } from "../lib/online-admission";

const headers = {
  "Cache-Control": "private, no-store",
  "Referrer-Policy": "no-referrer",
  "X-Robots-Tag": "noindex, nofollow",
};
/** 200 events of about 250 bytes each, with room to spare. */
const MAX_BODY_BYTES = 128 * 1024;

type Dependencies = {
  authorize: () => Promise<AdmissionActor | null>;
  reconcile: (
    actor: AdmissionActor,
    events: readonly ScanEventReport[],
  ) => Promise<{ acks: ScanEventAck[]; revoked: boolean }>;
};

/** POST /api/checkin/sync: a gate device uploads the scans it made offline (TICKET-173). */
export async function scanSyncResponse(request: Request, deps: Dependencies): Promise<Response> {
  try {
    const actor = await deps.authorize();
    if (!actor) return Response.json({ error: "Gate sign-in required." }, { status: 403, headers });

    if (request.headers.get("origin") !== new URL(request.url).origin)
      return Response.json({ error: "These scans could not be read." }, { status: 400, headers });
    const body = await readBoundedJson(request, MAX_BODY_BYTES);
    if (body.status === "too-large")
      return Response.json({ error: "Send fewer scans at a time." }, { status: 413, headers });
    const parsed = scanSyncUploadSchema.safeParse(body.status === "valid" ? body.value : null);
    if (!parsed.success)
      return Response.json({ error: "These scans could not be read." }, { status: 400, headers });
    if (
      parsed.data.expectedActor.staffId !== actor.staffId ||
      parsed.data.expectedActor.deviceId !== actor.deviceId
    )
      return Response.json(
        { error: "Sign in as the original gate operator to send these scans." },
        { status: 403, headers },
      );
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
