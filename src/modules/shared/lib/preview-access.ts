/** Production previews are an explicit loopback-only verification facility. */
export function allowDevPreview(
  nodeEnv: string | undefined,
  enabled: string | undefined,
  hostname: string,
): boolean {
  if (nodeEnv === "development") return true;
  return enabled === "1" && ["localhost", "127.0.0.1", "[::1]"].includes(hostname);
}
