import "server-only";
import { unstable_rethrow } from "next/navigation";
import { createLogger } from "@/modules/shared/lib/logger";
import { credentialSnapshotSchema } from "../lib/revocation-snapshot";

const headers = {
  "Cache-Control": "private, no-store",
  "Referrer-Policy": "no-referrer",
  "X-Robots-Tag": "noindex, nofollow",
};
type Dependencies = { authorize: () => Promise<boolean>; load: () => Promise<unknown> };

export async function credentialSnapshotResponse(deps: Dependencies): Promise<Response> {
  try {
    if (!(await deps.authorize()))
      return Response.json({ error: "Gate sign-in required." }, { status: 403, headers });
    const parsed = credentialSnapshotSchema.safeParse(await deps.load());
    if (parsed.success) return Response.json(parsed.data, { headers });
  } catch (error) {
    unstable_rethrow(error);
  }
  createLogger({ module: "revocation-snapshot" }).warn("credential snapshot unavailable");
  return Response.json(
    { error: "Guest list unavailable. Please try again." },
    { status: 503, headers },
  );
}
