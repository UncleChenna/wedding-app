import { createClient } from "@supabase/supabase-js";
import type { RealtimeChannelLike, RealtimeClientLike } from "./station-channel";

export type StationClient = RealtimeClientLike & { disconnect: () => void; connect: () => void };

/**
 * A Supabase client for one staff screen's live updates (ADR 0024). It uses the `accessToken`
 * option, so supabase-js's Auth module (unused by PIN-signed-in staff) can't reset the Realtime
 * token to the publishable key behind the helper's back. Staff screens never read tables with it.
 */
export function createStationClient(url: string, publishableKey: string): StationClient {
  let current = publishableKey;
  const client = createClient(url, publishableKey, {
    accessToken: async () => current,
  });
  return {
    realtime: {
      setAuth: async (token: string) => {
        current = token;
        await client.realtime.setAuth(token);
      },
    },
    // supabase-js's channel type is wider than the slice the helper uses.
    channel: (topic, options) => client.channel(topic, options) as unknown as RealtimeChannelLike,
    removeChannel: (channel) =>
      client.removeChannel(channel as unknown as Parameters<typeof client.removeChannel>[0]),
    disconnect: () => client.realtime.disconnect(),
    connect: () => client.realtime.connect(),
  };
}
