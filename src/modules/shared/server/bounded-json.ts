import "server-only";

export type BoundedJson = { status: "valid"; value: unknown } | { status: "invalid" | "too-large" };

/** Bound bytes while consuming the stream; Content-Length is only an early rejection hint. */
export async function readBoundedJson(
  request: Request,
  maximumBytes: number,
): Promise<BoundedJson> {
  const declared = request.headers.get("content-length");
  if (declared !== null && (!/^\d+$/.test(declared) || Number(declared) > maximumBytes)) {
    await request.body?.cancel().catch(() => undefined);
    return { status: /^\d+$/.test(declared) ? "too-large" : "invalid" };
  }
  const reader = request.body?.getReader();
  if (!reader) return { status: "invalid" };
  const parts: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const part = await reader.read();
      if (part.done) break;
      size += part.value.byteLength;
      if (size > maximumBytes) {
        await reader.cancel().catch(() => undefined);
        return { status: "too-large" };
      }
      parts.push(part.value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const part of parts) {
      bytes.set(part, offset);
      offset += part.byteLength;
    }
    return { status: "valid", value: JSON.parse(new TextDecoder().decode(bytes)) as unknown };
  } catch {
    return { status: "invalid" };
  } finally {
    reader.releaseLock();
  }
}
