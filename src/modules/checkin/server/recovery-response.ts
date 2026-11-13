import "server-only";
import { createHash } from "node:crypto";
import { logger } from "@/modules/shared/lib/logger";
import {
  recoveryImportSchema,
  recoveryRecordIdentity,
  RECOVERY_BODY_LIMIT,
  type RecoveryRecord,
} from "../lib/recovery";
import type { ScanEventAck } from "../lib/scan-sync";
import { signRecoveryReceipt, verifyRecoveryReceipt } from "./recovery-receipt";
const headers = {
  "Cache-Control": "private, no-store",
  "Referrer-Policy": "no-referrer",
  "X-Robots-Tag": "noindex, nofollow",
};
const reply = (body: unknown, status = 200) => Response.json(body, { status, headers });
export async function readRecoveryBody(
  request: Request,
  limit = RECOVERY_BODY_LIMIT,
): Promise<unknown> {
  if (request.headers.get("origin") !== new URL(request.url).origin) return null;
  if (!(request.headers.get("content-type") ?? "").startsWith("application/json")) return null;
  if (Number(request.headers.get("content-length") ?? 0) > limit) return null;
  const reader = request.body?.getReader();
  if (!reader) return null;
  const parts: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const row = await reader.read();
      if (row.done) break;
      size += row.value.byteLength;
      if (size > limit) {
        await reader.cancel();
        return null;
      }
      parts.push(row.value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const part of parts) {
      bytes.set(part, offset);
      offset += part.byteLength;
    }
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null;
  } finally {
    reader.releaseLock();
  }
}
export interface RecoveryPorts {
  authorize(): Promise<string | null>;
  key(): Buffer | null;
  reconcile(
    adminId: string,
    requestId: string,
    records: readonly RecoveryRecord[],
    reauthorize: () => Promise<boolean>,
  ): Promise<ScanEventAck[]>;
}
export async function recoveryImportResponse(
  request: Request,
  ports: RecoveryPorts,
): Promise<Response> {
  try {
    const adminId = await ports.authorize();
    if (!adminId) return reply({ message: "Please complete two-step sign-in first." }, 403);
    const parsed = recoveryImportSchema.safeParse(await readRecoveryBody(request));
    if (!parsed.success)
      return reply({ message: "Choose a valid recovery file and confirm your review." }, 400);
    const key = ports.key();
    if (!key || key.length < 32)
      return reply(
        { message: "Recovery is unavailable. Keep the original file and try again." },
        503,
      );
    const acks = await ports.reconcile(
      adminId,
      parsed.data.requestId,
      parsed.data.evidence.records,
      async () => (await ports.authorize()) === adminId,
    );
    const entries = parsed.data.evidence.records.flatMap((record) => {
      const ack = acks.find((row) => row.clientEventId === record.event.clientEventId);
      return ack && (ack.status === "recorded" || ack.status === "duplicate")
        ? [
            {
              actor: record.actor,
              digest: createHash("sha256").update(recoveryRecordIdentity(record)).digest("hex"),
              ack,
            },
          ]
        : [];
    });
    const receipt = entries.length
      ? signRecoveryReceipt(
          { version: 1, expiresAt: Date.now() + 24 * 60 * 60 * 1000, entries },
          key,
        )
      : null;
    return reply({ acks, receipt });
  } catch {
    logger.child({ module: "checkin-recovery" }).warn("Recovery import unavailable");
    return reply(
      {
        message: "We couldn't confirm recovery. Keep the original file and retry the same review.",
      },
      503,
    );
  }
}
/** A signed receipt proves only previously committed evidence; it grants no staff or admin access. */
export async function recoveryReceiptResponse(
  request: Request,
  key: Buffer | null,
): Promise<Response> {
  const body = await readRecoveryBody(request, 300 * 1024);
  if (
    !key ||
    !body ||
    typeof body !== "object" ||
    !("receipt" in body) ||
    typeof body.receipt !== "string" ||
    Object.keys(body).length !== 1
  )
    return reply(
      { message: "This receipt could not be verified. Keep the records on this device." },
      400,
    );
  const receipt = verifyRecoveryReceipt(body.receipt, key);
  return receipt
    ? reply(receipt)
    : reply(
        {
          message: "This receipt is invalid or expired. Ask the administrator for a fresh receipt.",
        },
        400,
      );
}
