import { developmentWorkerResponse } from "@/modules/shared/server/development-worker";
import { connection } from "next/server";
import { readScannerAssets } from "@/modules/checkin/server/scanner-assets";

import { serviceWorkerResponse } from "@/modules/shared/server/service-worker-response";

/** The service worker, served from the root so its scope covers the whole site. */
export async function GET(request: Request) {
  // Render per request: a prerendered copy would carry framework cache headers, and the
  // worker script itself must never be cached (ADR 0014).
  await connection();
  if (process.env.NODE_ENV === "development") return developmentWorkerResponse();
  const scanner = await readScannerAssets();
  if (!scanner)
    return new Response("Offline assets unavailable", {
      status: 503,
      headers: { "Cache-Control": "no-store" },
    });
  return serviceWorkerResponse(scanner, request.headers.get("accept-encoding") ?? "");
}
