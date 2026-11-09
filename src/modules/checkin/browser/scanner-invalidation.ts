export interface ScannerIdentity {
  session: string;
  build?: string;
  expiresAt: number;
}

/** Replacement messages may retain only the matching, no-shorter server-issued session. */
export function scannerInvalidated(data: unknown, identity?: ScannerIdentity): boolean {
  if (
    typeof data !== "object" ||
    data === null ||
    !("type" in data) ||
    data.type !== "SCANNER_INVALIDATED"
  )
    return false;
  if (
    !identity ||
    !("current" in data) ||
    typeof data.current !== "object" ||
    data.current === null
  )
    return true;
  const current = data.current as Record<string, unknown>;
  return (
    current.session !== identity.session ||
    (identity.build !== undefined && current.build !== identity.build) ||
    typeof current.expiresAt !== "number" ||
    !Number.isSafeInteger(current.expiresAt) ||
    current.expiresAt < identity.expiresAt
  );
}
