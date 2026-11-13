import { expect, it, vi } from "vitest";
import { readBoundedJson } from "../server/bounded-json";
const request = (body: string, headers?: HeadersInit) =>
  new Request("https://wedding.example", { method: "POST", body, headers });
it("accepts exact byte limits and measures UTF-8 bytes rather than characters", async () => {
  expect(await readBoundedJson(request('"é"'), 4)).toEqual({ status: "valid", value: "é" });
  expect(await readBoundedJson(request('"é"'), 3)).toEqual({ status: "too-large" });
});
it("does not trust a forged short Content-Length", async () => {
  expect(await readBoundedJson(request('"large"', { "content-length": "1" }), 3)).toEqual({
    status: "too-large",
  });
});
it("rejects absent, malformed and oversized declared bodies", async () => {
  expect(await readBoundedJson(new Request("https://wedding.example"), 20)).toEqual({
    status: "invalid",
  });
  expect(await readBoundedJson(request("{"), 20)).toEqual({ status: "invalid" });
  expect(await readBoundedJson(request("{}", { "content-length": "-1" }), 20)).toEqual({
    status: "invalid",
  });
  expect(await readBoundedJson(request("{}", { "content-length": "21" }), 20)).toEqual({
    status: "too-large",
  });
});
it("reassembles split multibyte characters and releases the stream lock", async () => {
  const bytes = new TextEncoder().encode('"é"');
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(bytes.slice(0, 2));
      controller.enqueue(bytes.slice(2));
      controller.close();
    },
  });
  const init: RequestInit & { duplex: "half" } = { method: "POST", body, duplex: "half" };
  const input = new Request("https://wedding.example", init);
  expect(await readBoundedJson(input, 4)).toEqual({ status: "valid", value: "é" });
  expect(body.locked).toBe(false);
});
it("returns invalid on stream failure without exposing the exception", async () => {
  const cancel = vi.fn();
  const body = new ReadableStream<Uint8Array>({
    pull(controller) {
      controller.error(new Error("private transport information"));
    },
    cancel,
  });
  const init: RequestInit & { duplex: "half" } = { method: "POST", body, duplex: "half" };
  expect(await readBoundedJson(new Request("https://wedding.example", init), 20)).toEqual({
    status: "invalid",
  });
  expect(body.locked).toBe(false);
});
