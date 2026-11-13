import "server-only";
import { readBoundedJson } from "@/modules/shared/server/bounded-json";
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
    const input = await readBoundedJson(request, 8192);
    if (input.status !== "valid")
      return Response.json({ state: "invalid" }, { status: 400, headers });
    const parsed = admissionRequestSchema.safeParse(input.value);
    if (!parsed.success) return Response.json({ state: "invalid" }, { status: 400, headers });
    const result = admissionResponseSchema.safeParse(await deps.submit(parsed.data, actor, origin));
    if (result.success) return Response.json(result.data, { headers });
  } catch (error) {
    unstable_rethrow(error);
  }
  logger.child({ module: "admission" }).warn("Admission could not be confirmed");
  return Response.json({ state: "unavailable" }, { status: 503, headers });
}
