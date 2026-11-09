import type { SeedProfile } from "./seed-data";

/** Reject typos before a destructive local seed transaction begins. */
export function parseSeedProfile(args: string[]): SeedProfile {
  if (args.length === 0) return "default";
  if (args.length === 2 && args[0] === "--profile" && (args[1] === "default" || args[1] === "load"))
    return args[1];
  throw new Error("Usage: pnpm db:seed [--profile default|load]");
}
