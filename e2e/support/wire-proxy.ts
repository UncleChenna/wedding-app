import { createConnection, createServer, type Socket } from "node:net";

/** Passive loopback HTTP/1 forwarding: includes service-worker bootstrap bytes
 * that Chromium's request.sizes() reports as zero. Never rewrites/compresses data. */
export async function wireProxy(target: string) {
  const url = new URL(target);
  if (url.protocol !== "http:" || !["localhost", "127.0.0.1"].includes(url.hostname)) {
    throw new Error("Transfer measurement requires an owned loopback HTTP target");
  }
  const sockets = new Set<Socket>();
  let bytes = 0;
  let lastReceived = Date.now();
  let failure: Error | undefined;
  const server = createServer((client) => {
    const upstream = createConnection({ host: url.hostname, port: Number(url.port || 80) });
    for (const socket of [client, upstream]) {
      sockets.add(socket);
      socket.once("close", () => sockets.delete(socket));
    }
    upstream.on("data", (chunk: Buffer) => {
      bytes += chunk.length;
      lastReceived = Date.now();
    });
    upstream.on("error", (error) => {
      failure = error;
      client.destroy();
    });
    client.on("error", () => upstream.destroy());
    client.once("close", () => upstream.destroy());
    client.pipe(upstream).pipe(client);
  });
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Missing measurement port");
  return {
    origin: `http://127.0.0.1:${address.port}`,
    snapshot() {
      if (failure) throw failure;
      return {
        bytes,
        lastReceived,
        pendingBytes: [...sockets].reduce((sum, socket) => sum + socket.writableLength, 0),
      };
    },
    async close() {
      for (const socket of sockets) socket.destroy();
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
    },
  };
}
