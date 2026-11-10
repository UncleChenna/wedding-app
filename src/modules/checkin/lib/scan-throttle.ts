/** Per-code suppression uses the caller's monotonic clock; never stores QR data on disk. */
export function createScanThrottle(): (code: string, now: number) => boolean {
  const accepted = new Map<string, number>();
  return (code, now) => {
    if (!code || code.length > 4096 || !Number.isFinite(now) || now < 0) return false;
    for (const [previous, at] of accepted) {
      if (now - at >= 3000) accepted.delete(previous);
    }
    if (accepted.has(code)) return false;
    accepted.set(code, now);
    return true;
  };
}
