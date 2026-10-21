import { execFile } from "node:child_process";
import { watch } from "node:fs";
import { createServer } from "node:http";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { dashboardHtml } from "./dashboard";
import type { Ticket } from "./model";

export interface LiveSnapshot {
  tickets: Ticket[];
  source: string;
  base: string;
  generated: string;
  connected: boolean;
}
interface Options {
  cwd: string;
  port?: number;
  intervalMs?: number;
  watchFiles?: boolean;
  load: (signal: AbortSignal) => Promise<LiveSnapshot>;
}

/** The only HTTP surface is a read-only loopback board; Git runs outside its event loop. */
export async function startDashboard(options: Options) {
  const controller = new AbortController();
  let state = {
    tickets: [] as Ticket[],
    source: "Connecting to ledger…",
    base: "unknown",
    generated: "",
    connected: false,
    lastSuccess: null as string | null,
    checkout: options.cwd,
  };
  let closed = false;
  let pending: Promise<void> | undefined;
  let debounce: ReturnType<typeof setTimeout> | undefined;
  const refresh = (): Promise<void> => {
    if (closed) return Promise.resolve();
    if (pending) return pending;
    pending = options
      .load(controller.signal)
      .then((next) => {
        if (!closed)
          state = {
            ...state,
            ...next,
            lastSuccess: next.connected ? next.generated : state.lastSuccess,
          };
      })
      .catch(() => {
        if (!closed)
          state = {
            ...state,
            connected: false,
            source: "Refresh failed; retrying. Last valid data retained.",
          };
      })
      .finally(() => {
        pending = undefined;
      });
    return pending;
  };
  let port = options.port ?? 4173;
  const server = createServer((request, response) => {
    response.setHeader("Cache-Control", "no-store");
    response.setHeader("X-Content-Type-Options", "nosniff");
    response.setHeader("X-Frame-Options", "DENY");
    const hosts = [`127.0.0.1:${port}`, `localhost:${port}`];
    const origins = hosts.map((host) => `http://${host}`);
    if (
      !hosts.includes(request.headers.host ?? "") ||
      (request.headers.origin && !origins.includes(request.headers.origin)) ||
      request.headers["sec-fetch-site"] === "cross-site"
    ) {
      response.writeHead(403);
      response.end("Local same-origin access only.");
      return;
    }
    if (request.method !== "GET") {
      response.writeHead(405, { Allow: "GET" });
      response.end();
      return;
    }
    if (request.url === "/api/board") {
      response.setHeader("Content-Type", "application/json; charset=utf-8");
      response.end(JSON.stringify(state));
      return;
    }
    if (request.url === "/") {
      response.setHeader("Content-Type", "text/html; charset=utf-8");
      response.end(dashboardHtml(state.tickets, state.source, state.base, true));
      return;
    }
    response.writeHead(404);
    response.end("Not found.");
  });
  await new Promise<void>((done, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", done);
  });
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("No dashboard port assigned.");
  port = address.port;
  const timer = setInterval(() => {
    void refresh();
  }, options.intervalMs ?? 20000);
  let watcher: ReturnType<typeof watch> | undefined;
  if (options.watchFiles !== false) {
    try {
      watcher = watch(join(options.cwd, "tickets"), () => {
        clearTimeout(debounce);
        debounce = setTimeout(() => {
          void refresh();
        }, 250);
      });
      watcher.on("error", () => {
        watcher?.close();
      }); // Periodic refresh remains available.
    } catch {
      /* Missing/unavailable directory is retried by periodic snapshots. */
    }
  }
  void refresh();
  return {
    url: `http://127.0.0.1:${port}`,
    refresh,
    close: async () => {
      closed = true;
      controller.abort();
      clearInterval(timer);
      clearTimeout(debounce);
      watcher?.close();
      server.closeAllConnections();
      await new Promise<void>((done) => server.close(() => done()));
    },
  };
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length && (args.length !== 2 || args[0] !== "--port"))
    throw new Error("Usage: pnpm t:dashboard [--port 4173]");
  const port = args.length ? Number(args[1]) : 4173;
  if (!Number.isInteger(port) || port < 1 || port > 65535)
    throw new Error("Port must be an integer from 1 to 65535.");
  const exec = promisify(execFile);
  const cli = fileURLToPath(new URL("../tickets.ts", import.meta.url));
  const cwd = process.cwd();
  console.log("Starting ticket dashboard…");
  const app = await startDashboard({
    cwd,
    port,
    load: async (signal) => {
      const { stdout } = await exec(
        process.execPath,
        ["--import", "tsx", cli, "dashboard", "--json"],
        {
          cwd,
          signal,
          timeout: 12000,
          maxBuffer: 8 * 1024 * 1024,
          env: {
            ...process.env,
            GIT_TERMINAL_PROMPT: "0",
            GCM_INTERACTIVE: "never",
            GIT_SSH_COMMAND:
              process.env.GIT_SSH_COMMAND ?? "ssh -o BatchMode=yes -o ConnectTimeout=8",
          },
        },
      );
      return JSON.parse(stdout) as LiveSnapshot;
    },
  });
  console.log(`Dashboard ready at ${app.url} (local files watched; ledger refresh every 20s)`);
  const stop = () => {
    void app.close();
  };
  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error: NodeJS.ErrnoException) => {
    console.error(
      error.code === "EADDRINUSE"
        ? "Dashboard port is in use. Open the existing board or choose --port 4174."
        : error.message,
    );
    process.exitCode = 1;
  });
}
