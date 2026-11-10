import "server-only";
import { unstable_rethrow } from "next/navigation";
import { logger } from "@/modules/shared/lib/logger";
import {
  admissionRequestSchema,
  admissionResponseSchema,
  type AdmissionActor,
  type AdmissionRequest,
  type AdmissionResponse,
} from "../lib/online-admission";

const headers = {
  "Cache-Control": "private, no-store",
  "Referrer-Policy": "no-referrer",
  "X-Robots-Tag": "noindex, nofollow",
};
type Dependencies = {
  authorize: () => Promise<AdmissionActor | null>;
  submit: (
    request: AdmissionRequest,
    actor: AdmissionActor,
    origin: string,
  ) => Promise<AdmissionResponse>;
};
export async function admissionResponse(request: Request, deps: Dependencies): Promise<Response> {
  try {
    const actor = await deps.authorize();
    if (!actor) return Response.json({ state: "session_expired" }, { status: 403, headers });
    const origin = new URL(request.url).origin;
    // Cookie authentication alone is insufficient against a same-site hostile origin.
    if (request.headers.get("origin") !== origin)
      return Response.json({ state: "invalid" }, { status: 400, headers });
    const text = await request.text();
    if (new TextEncoder().encode(text).byteLength > 8192)
      return Response.json({ state: "invalid" }, { status: 400, headers });
    let input: unknown;
    try {
      input = JSON.parse(text);
    } catch {
      input = null;
    }
    const parsed = admissionRequestSchema.safeParse(input);
    if (!parsed.success) return Response.json({ state: "invalid" }, { status: 400, headers });
    const result = admissionResponseSchema.safeParse(await deps.submit(parsed.data, actor, origin));
    if (result.success) return Response.json(result.data, { headers });
  } catch (error) {
    unstable_rethrow(error);
  }
  logger.child({ module: "admission" }).warn("Admission could not be confirmed");
  return Response.json({ state: "unavailable" }, { status: 503, headers });
}
