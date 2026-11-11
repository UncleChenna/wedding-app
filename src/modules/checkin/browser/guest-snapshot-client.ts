import { parseGuestSnapshot, type GuestSnapshot } from "../lib/guest-snapshot";
import { scannerWorkerMessage } from "./scanner-worker-message";

/** Only the worker reads durable private storage; the window receives a transient validated copy. */
export async function readGuestSnapshot(
  authority: Pick<GuestSnapshot, "session" | "expiresAt">,
): Promise<GuestSnapshot | null> {
  if (!Number.isSafeInteger(authority.expiresAt) || authority.expiresAt <= Date.now()) return null;
  const reply = await scannerWorkerMessage("READ_GUEST_SNAPSHOT", authority.session);
  if (
    typeof reply !== "object" ||
    reply === null ||
    !("state" in reply) ||
    reply.state !== "ready" ||
    !("snapshot" in reply)
  )
    return null;
  const snapshot = parseGuestSnapshot(reply.snapshot);
  if (!snapshot || snapshot.session !== authority.session) return null;
  const expiresAt = Math.min(snapshot.expiresAt, authority.expiresAt);
  return expiresAt > Date.now() ? { ...snapshot, expiresAt } : null;
}
