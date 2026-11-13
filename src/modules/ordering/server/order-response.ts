import "server-only";
import { readBoundedJson } from "@/modules/shared/server/bounded-json";
import { logger } from "@/modules/shared/lib/logger";
import { orderSubmissionSchema, type OrderResult, type OrderSubmission } from "../lib/order";

const MAX_BODY_BYTES = 8 * 1024;
const headers = { "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex, nofollow" };
const statusFor: Record<OrderResult["status"], number> = {
  created: 201,
  replayed: 200,
  rejected: 422,
  unavailable: 503,
};

function respond(result: OrderResult) {
  const status =
    result.status === "rejected" && result.reason === "mismatch" ? 409 : statusFor[result.status];
  return Response.json(result, { status, headers });
}

/**
 * POST /api/orders. Only a JSON body is accepted (a cross-site form cannot send one without a
 * CORS preflight). Expected failures are fixed codes; database errors become a retryable 503.
 */
export async function orderResponse(
  request: Request,
  create: (order: OrderSubmission) => Promise<OrderResult>,
): Promise<Response> {
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    return respond({ status: "rejected", reason: "invalid" });
  const body = await readBoundedJson(request, MAX_BODY_BYTES);
  if (body.status !== "valid") return respond({ status: "rejected", reason: "invalid" });
  const parsed = orderSubmissionSchema.safeParse(body.value);
  if (!parsed.success) return respond({ status: "rejected", reason: "invalid" });
  try {
    const result = await create(parsed.data);
    logger.child({ module: "ordering" }).info("Order submission", {
      result: result.status,
      reason: result.status === "rejected" ? result.reason : undefined,
    });
    return respond(result);
  } catch {
    logger.child({ module: "ordering" }).warn("Order submission unavailable");
    return respond({ status: "unavailable" });
  }
}
