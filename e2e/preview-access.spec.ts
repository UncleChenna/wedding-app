import { spawn } from "node:child_process";
import { once } from "node:events";
import { resolve } from "node:path";
import { expect, test } from "@playwright/test";
import { routeList } from "../src/modules/shared/lib/routes";

const previews = routeList.filter((route) => route.audience === "dev");
test("production preview routes require the explicit local opt-in @smoke", async ({
  request,
  baseURL,
}, info) => {
  test.setTimeout(60_000);
  if (!baseURL) throw new Error("Missing local browser test URL");
  const port = Number(new URL(baseURL).port) + (info.project.name === "desktop" ? 3 : 2);
  const origin = `http://127.0.0.1:${port}`;
  const child = spawn(
    process.execPath,
    [
      resolve("node_modules/next/dist/bin/next"),
      "start",
      "--hostname",
      "127.0.0.1",
      "--port",
      String(port),
    ],
    {
      env: { ...process.env, NODE_ENV: "production", ENABLE_LOCAL_PREVIEWS: "" },
      stdio: ["ignore", "ignore", "pipe"],
    },
  );
  let serverErrors = "";
  child.stderr?.on("data", (data: Buffer) => {
    serverErrors += data.toString();
  });
  try {
    await expect
      .poll(
        async () => {
          if (child.exitCode !== null)
            throw new Error(`Production fixture exited: ${serverErrors}`);
          try {
            return (await request.get(origin + "/dev")).status();
          } catch {
            return 0;
          }
        },
        { timeout: 30_000 },
      )
      .toBe(404);
    for (const route of previews) {
      const response = await request.get(origin + route.path);
      expect(response.status(), route.path).toBe(404);
      expect(response.headers()["cache-control"]).toContain("no-store");
      expect(response.headers()["x-robots-tag"]).toContain("noindex");
    }
    const attemptedOptIn = await request.get(origin + "/dev/theme?ENABLE_LOCAL_PREVIEWS=1", {
      headers: { RSC: "1" },
    });
    expect(attemptedOptIn.status()).toBe(404);
  } finally {
    if (child.exitCode === null) {
      const exited = once(child, "exit");
      child.kill("SIGTERM");
      await exited;
    }
  }
});

test("the explicitly enabled loopback test server retains every preview @smoke", async ({
  request,
}) => {
  for (const route of previews) {
    const response = await request.get(route.path);
    expect(response.status(), route.path).toBe(200);
    expect(response.headers()["cache-control"]).toContain("no-store");
  }
});
