import "server-only";
import { gzipSync } from "node:zlib";
import { serviceWorkerSource } from "./service-worker";

/** /sw.js must never be cached itself, so updates are always noticed. */
export function serviceWorkerResponse(
  scanner: { build: string; assets: readonly string[]; verifier?: string } | null = null,
  acceptEncoding = "",
): Response {
  // Compress the public worker itself as well as ordinary framework responses.
  // Identity remains available; an explicit gzip refusal must not be overridden.
  const gzip = acceptEncoding.split(",").some((entry) => {
    const [coding, ...parameters] = entry.trim().toLowerCase().split(";");
    if (coding !== "gzip") return false;
    const quality = parameters.find((parameter) => parameter.trim().startsWith("q="));
    return (
      quality === undefined ||
      (/^q=(?:1(?:\.0{0,3})?|0?\.\d{1,3})$/.test(quality.trim()) &&
        Number(quality.trim().slice(2)) > 0)
    );
  });
  const source = serviceWorkerSource(scanner);
  return new Response(gzip ? new Uint8Array(gzipSync(source)) : source, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Service-Worker-Allowed": "/",
      Vary: "Accept-Encoding",
      ...(gzip ? { "Content-Encoding": "gzip" } : {}),
    },
  });
}
