import { connection } from "next/server";

import { serviceWorkerResponse } from "@/modules/shared/server/service-worker";

/** The service worker, served from the root so its scope covers the whole site. */
export async function GET() {
  // Render per request: a prerendered copy would carry framework cache headers, and the
  // worker script itself must never be cached (ADR 0014).
  await connection();
  return serviceWorkerResponse();
}
