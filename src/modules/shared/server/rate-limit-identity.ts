import "server-only";

import { createHmac } from "node:crypto";
import { isIP } from "node:net";

/** Caller selects platform from server configuration, never from request headers. */
export function rateLimitIdentity(
  headers: Pick<Headers, "get">,
  platform: "vercel" | "local",
  key: string,
): string | null {
  if (!key) return null;
  let network = "local-shared";
  if (platform === "vercel") {
    const raw = headers.get("x-vercel-forwarded-for");
    if (!raw || raw.includes("%")) return null;
    const version = isIP(raw);
    if (version === 4) {
      network = `ipv4:${raw}`;
    } else if (version === 6) {
      // URL canonicalization collapses alternate spellings, including mapped IPv4.
      const canonical = new URL(`http://[${raw}]/`).hostname.slice(1, -1);
      const [left = "", right = ""] = canonical.split("::");
      const start = left ? left.split(":") : [];
      const end = right ? right.split(":") : [];
      const words = canonical.includes("::")
        ? [...start, ...Array<string>(8 - start.length - end.length).fill("0"), ...end]
        : start;
      const numbers = words.map((word) => Number.parseInt(word, 16));
      if (numbers.slice(0, 5).every((word) => word === 0) && numbers[5] === 0xffff) {
        const high = numbers[6] ?? 0;
        const low = numbers[7] ?? 0;
        network = `ipv4:${high >> 8}.${high & 255}.${low >> 8}.${low & 255}`;
      } else {
        network = `ipv6:${numbers
          .slice(0, 4)
          .map((word) => word.toString(16))
          .join(":")}/64`;
      }
    } else {
      return null;
    }
  }
  // UTC epochs are server-owned and identical across instances. Rotation also resets
  // a network's budget at the boundary; it does not make shared-network abuse impossible.
  const epoch = Math.floor(Date.now() / 86_400_000);
  const dailyKey = createHmac("sha256", key).update(`rate-limit:salt:v2:${epoch}`).digest();
  return createHmac("sha256", dailyKey).update(`rate-limit:identity:v2:${network}`).digest("hex");
}
