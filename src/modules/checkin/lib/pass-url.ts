/**
 * The QR on a guest's pass opens this read-only page (ADR 0020 decision 1). It never carries
 * or reveals the personal `/i/<token>` link, so a forwarded pass cannot edit an RSVP.
 */
export function gatePassPath(token: string): `/p/${string}` {
  return `/p/${token}`;
}

export function gatePassUrl(siteUrl: string, token: string): string {
  return new URL(gatePassPath(token), siteUrl).toString();
}
