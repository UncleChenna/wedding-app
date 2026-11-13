import { createServer } from "node:http";
import { createConnection } from "node:net";
import { expect, it } from "vitest";
import { wireProxy } from "../../e2e/support/wire-proxy";

it("counts exact forwarded response bytes, including a worker script and chunk framing", async () => {
  const server = createServer((request, response) => {
    expect(request.headers["service-worker"]).toBe("script");
    response.setHeader("content-type", "application/javascript");
    response.write("/* first */");
    response.end("self.addEventListener('install',()=>{});");
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("No fixture port");
  const proxy = await wireProxy(`http://127.0.0.1:${address.port}`);
  try {
    const output = await new Promise<Buffer>((resolve, reject) => {
      const connection = createConnection(Number(new URL(proxy.origin).port), "127.0.0.1");
      const chunks: Buffer[] = [];
      connection.on("data", (chunk: Buffer) => chunks.push(chunk));
      connection.on("error", reject);
      connection.on("end", () => resolve(Buffer.concat(chunks)));
      connection.on("connect", () =>
        connection.write(
          "GET /sw.js HTTP/1.1\r\nHost: localhost\r\nService-Worker: script\r\nConnection: close\r\n\r\n",
        ),
      );
    });
    expect(output.toString()).toContain("self.addEventListener");
    expect(output.toString()).toContain("Transfer-Encoding: chunked");
    expect(proxy.snapshot().bytes).toBe(output.length);
    expect(output.length).toBeGreaterThan(100);
  } finally {
    await proxy.close();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

it("rejects non-loopback or TLS targets rather than guessing wire sizes", async () => {
  await expect(wireProxy("https://example.com")).rejects.toThrow("owned loopback");
  await expect(wireProxy("http://example.com")).rejects.toThrow("owned loopback");
});
