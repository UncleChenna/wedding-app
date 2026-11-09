import "server-only";
import type { Station } from "../lib/realtime-channels";
import { serverEnv } from "./env";
import { mintStationToken } from "./realtime-token";
import { realtimeTokenResponse } from "./realtime-token-response";
import { currentStaffDevice } from "./staff-cookies";

/** Live staff, device, credential and event-expiry checks run on every token request. */
export function postRealtimeToken(station: Station) {
  return realtimeTokenResponse(station, {
    authorize: async () => (await currentStaffDevice(station))?.device.id ?? null,
    secret: serverEnv.SUPABASE_JWT_SECRET,
    mint: mintStationToken,
  });
}
