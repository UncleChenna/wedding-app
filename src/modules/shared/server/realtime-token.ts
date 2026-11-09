import "server-only";
import { createHmac } from "node:crypto";
import type { RealtimeToken, Station } from "../lib/realtime-channels";

/** Short, so a revoked device stops receiving within minutes: each refresh rechecks live access. */
export const REALTIME_TOKEN_SECONDS = 10 * 60;

const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString("base64url");

/**
 * Mints the Supabase Realtime token for one signed-in station device (ADR 0024). It's an
 * `authenticated` token whose only privilege is the `staff_station` claim that the
 * `staff_station_broadcast_receive` policy reads. It can't read any table: none has a policy.
 */
export function mintStationToken(
  { station, deviceId }: { station: Station; deviceId: string },
  secret: string,
  now = new Date(),
): RealtimeToken {
  const issuedAt = Math.floor(now.getTime() / 1000);
  const expires = issuedAt + REALTIME_TOKEN_SECONDS;
  const header = encode({ alg: "HS256", typ: "JWT" });
  const body = encode({
    aud: "authenticated",
    role: "authenticated",
    sub: deviceId,
    staff_station: station,
    iat: issuedAt,
    exp: expires,
  });
  const signature = createHmac("sha256", secret).update(`${header}.${body}`).digest("base64url");
  return {
    token: `${header}.${body}.${signature}`,
    expiresAt: new Date(expires * 1000).toISOString(),
  };
}
