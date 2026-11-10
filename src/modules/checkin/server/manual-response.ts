import "server-only";
import { unstable_rethrow } from "next/navigation";
import { logger } from "@/modules/shared/lib/logger";
import {
  manualRequestSchema,
  manualResponseSchema,
  type ManualReadRequest,
  type ManualAdmissionRequest,
  type ManualSelection,
} from "../lib/manual-checkin";
import type { GuestNameMatch } from "../lib/manual-search";
import type { AdmissionActor, AdmissionResponse } from "../lib/online-admission";

export interface ManualPorts {
  authorize(): Promise<AdmissionActor | null>;
  search(query: string): Promise<{ matches: GuestNameMatch[]; hasMore: boolean }>;
  read(
    input: ManualReadRequest,
    actor: AdmissionActor,
  ): Promise<ManualSelection | AdmissionResponse>;
  admit(input: ManualAdmissionRequest, actor: AdmissionActor): Promise<AdmissionResponse>;
}
const headers = {
  "Cache-Control": "private, no-store",
  "Referrer-Policy": "no-referrer",
  "X-Robots-Tag": "noindex, nofollow",
};
async function boundedJson(request: Request): Promise<unknown> {
  const reader = request.body?.getReader();
  if (!reader) return null;
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      size += part.value.byteLength;
      if (size > 2048) {
        await reader.cancel();
        return null;
      }
      chunks.push(part.value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.length;
    }
    try {
      return JSON.parse(new TextDecoder().decode(bytes));
    } catch {
      return null;
    }
  } finally {
    reader.releaseLock();
  }
}

/** Gate-only POST boundary; no names in URLs/logs and no client-controlled audit identity. */
export async function manualResponse(request: Request, ports: ManualPorts): Promise<Response> {
  const respond = (value: unknown, status = 200) => Response.json(value, { status, headers });
  try {
    const actor = await ports.authorize();
    if (!actor) return respond({ state: "session_expired" }, 403);
    if (request.headers.get("origin") !== new URL(request.url).origin)
      return respond({ state: "invalid" }, 400);
    const parsed = manualRequestSchema.safeParse(await boundedJson(request));
    if (!parsed.success) return respond({ state: "invalid" }, 400);
    const input = parsed.data;
    const result =
      input.operation === "search"
        ? { state: "matches", ...(await ports.search(input.query)) }
        : input.operation === "read"
          ? await ports.read(input, actor)
          : await ports.admit(input, actor);
    const current = await ports.authorize();
    if (
      !current ||
      current.staffId !== actor.staffId ||
      current.deviceId !== actor.deviceId ||
      current.credentialVersion !== actor.credentialVersion
    )
      return respond({ state: "session_expired" }, 403);
    const output = manualResponseSchema.safeParse(result);
    if (output.success) return respond(output.data);
  } catch (error) {
    unstable_rethrow(error);
  }
  logger.child({ module: "manual-checkin" }).warn("Manual check-in unavailable");
  return respond({ state: "unavailable" }, 503);
}
