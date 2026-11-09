import { GATE_PASS_MAX_LENGTH } from "./gate-token";

/** Parse locally; a scanned URL is never fetched or navigated. */
export function signedPassToken(qr: string, origin: string): string | null {
  try {
    const url = new URL(qr);
    if (
      url.origin !== origin ||
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      !url.pathname.startsWith("/p/")
    )
      return null;
    const token = url.pathname.slice(3);
    return !token || token.length > GATE_PASS_MAX_LENGTH || token.includes("/") ? null : token;
  } catch {
    return null;
  }
}
