import "server-only";
import { db } from "@/modules/shared/server/db/client";
import { serverEnv } from "@/modules/shared/server/env";
import { logger } from "@/modules/shared/lib/logger";
import { drainAuthorized } from "../lib/drain-auth";
import { loggingSender } from "./alert-drain";
import { drainOrderAlerts } from "./alert-outbox";

const noStore = { "cache-control": "no-store" };

/**
 * `POST /api/alerts/drain`, called by the database scheduler every 10 seconds (ADR 0022). Only
 * a caller holding `ALERT_DRAIN_SECRET` may drain; without the secret the route is disabled.
 */
export async function alertDrainResponse(request: Request): Promise<Response> {
  const secret = serverEnv.ALERT_DRAIN_SECRET;
  if (!secret) return Response.json({ error: "unavailable" }, { status: 503, headers: noStore });
  if (!drainAuthorized(request.headers.get("authorization"), secret))
    return Response.json({ error: "unauthorized" }, { status: 401, headers: noStore });
  try {
    const result = await drainOrderAlerts(db, loggingSender);
    return Response.json(result, { headers: noStore });
  } catch (error) {
    logger.child({ module: "order-alerts" }).error("Order alert drain failed", {
      error: error instanceof Error ? error.name : "unknown",
    });
    return Response.json({ error: "unavailable" }, { status: 503, headers: noStore });
  }
}
