import "server-only";
import { createHmac } from "node:crypto";
import { cookies } from "next/headers";
import { unstable_rethrow } from "next/navigation";
import { logger } from "@/modules/shared/lib/logger";
import { securityHeaders } from "@/modules/shared/lib/security-headers";
import { serverEnv } from "@/modules/shared/server/env";
import {
  currentStaffDevice,
  staffSigningKey,
  STAFF_SESSION_COOKIE,
} from "@/modules/shared/server/staff-cookies";
import { activeThemesToCssText } from "@/modules/theming/lib/css-vars";
import type { ActiveThemes } from "@/modules/theming/lib/schema";
import type { ScannerShellGrant } from "../browser/scanner-shell-store";
import { readScannerAssets } from "./scanner-assets";

const headers = {
  "Cache-Control": "private, no-store, max-age=0",
  "X-Robots-Tag": "noindex, noarchive",
  "Referrer-Policy": "no-referrer",
};
const refuse = (status: number) =>
  Response.json({ state: status === 401 ? "denied" : "unavailable" }, { status, headers });

/** Only this live-authenticated server response can authorize a worker's saved scanner shell. */
export async function scannerShellResponse(
  loadThemes: () => Promise<ActiveThemes>,
): Promise<Response> {
  try {
    const session = await currentStaffDevice("gate");
    const expiresAt = session?.expiresAt.getTime();
    if (!session || !expiresAt || !Number.isSafeInteger(expiresAt) || expiresAt <= Date.now())
      return refuse(401);
    const key = staffSigningKey();
    const token = (await cookies()).get(STAFF_SESSION_COOKIE)?.value;
    if (!key || !token) return refuse(401);
    const assets = await readScannerAssets();
    if (!assets) return refuse(503);
    const css = activeThemesToCssText(await loadThemes());
    const preparedAt = Date.now();
    if (expiresAt <= preparedAt) return refuse(401);
    const fingerprint = createHmac("sha256", key)
      .update("wedding-scanner-shell-v1\0")
      .update(token)
      .digest("hex");
    const documentHeaders: [string, string][] = [
      ["Content-Type", "text/html; charset=utf-8"],
      ["Cache-Control", headers["Cache-Control"]],
      ["Referrer-Policy", "no-referrer"],
      ...securityHeaders({ isDev: serverEnv.NODE_ENV !== "production" })
        .filter(({ key }) => key === "Content-Security-Policy" || key === "Permissions-Policy")
        .map(({ key, value }): [string, string] => [key, value]),
    ];
    const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><meta name="robots" content="noindex, noarchive"><title>Gate scanner</title><link rel="stylesheet" href="${assets.stylesheet}">${assets.fonts.map((path) => `<link rel="preload" as="font" type="font/woff2" href="${path}" crossorigin>`).join("")}<style>${css}</style></head><body><div id="scanner-shell" data-expires-at="${expiresAt}"></div><noscript>Turn on JavaScript to use the camera scanner.</noscript><script defer src="${assets.script}"></script></body></html>`;
    const grant: ScannerShellGrant = {
      version: 1,
      session: fingerprint,
      build: assets.build,
      expiresAt,
      preparedAt,
      html,
      headers: documentHeaders,
      assets: assets.assets,
    };
    return Response.json(grant, { headers: { ...headers, "X-Wedding-Scanner-Shell": "1" } });
  } catch (error) {
    unstable_rethrow(error);
    logger.warn("Scanner shell preparation unavailable", { module: "checkin" });
    return refuse(503);
  }
}
