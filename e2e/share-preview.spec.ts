import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { expect, test } from "@playwright/test";
import postgres from "postgres";
import { listThemes } from "../src/modules/theming";

test("@smoke guest pages inherit public invitation preview metadata", async ({ page }) => {
  for (const path of ["/", "/invite", "/order", "/offline"]) {
    await page.goto(path);
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
      "content",
      "Uchenna & Adaora · 19 December 2026",
    );
    await expect(page.locator('meta[property="og:description"]')).toHaveAttribute(
      "content",
      "Two stories. One ending: forever.",
    );
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      "content",
      /\/invitation-preview$/,
    );
    await expect(page.locator('meta[property="og:image:width"]')).toHaveAttribute(
      "content",
      "1200",
    );
    await expect(page.locator('meta[property="og:image:height"]')).toHaveAttribute(
      "content",
      "630",
    );
  }
});

test("@smoke preview renders a complete 1200 by 630 PNG in every theme", async ({
  request,
  page,
}) => {
  const hashes = new Set<string>();
  for (const theme of listThemes()) {
    const response = await request.get("/invitation-preview?theme=" + theme.id);
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("image/png");
    const bytes = await response.body();
    expect(bytes.subarray(1, 4).toString()).toBe("PNG");
    expect(bytes.readUInt32BE(16)).toBe(1200);
    expect(bytes.readUInt32BE(20)).toBe(630);
    expect(bytes.length).toBeLessThan(8 * 1024 * 1024);
    hashes.add(bytes.toString("base64"));
    if (process.env.RUN_OG_REVIEW === "1") {
      mkdirSync("docs/reviews/TICKET-047", { recursive: true });
      writeFileSync("docs/reviews/TICKET-047/" + theme.id + ".png", bytes);
      for (const width of [375, 768, 1280]) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto("/invitation-preview?theme=" + theme.id);
        await expect(page.locator("img")).toBeVisible();
        await page.screenshot({
          path: "docs/reviews/TICKET-047/" + theme.id + "-" + width + ".png",
          fullPage: true,
        });
      }
    }
  }
  expect(hashes.size).toBe(listThemes().length);
  expect((await request.get("/invitation-preview?theme=unknown")).status()).toBe(400);
  expect((await request.get("/invitation-preview?theme=")).status()).toBe(400);
});

test("two synthetic invitations expose identical crawler metadata without guest details", async ({
  browser,
  baseURL,
}) => {
  test.skip(process.env.RUN_OG_REVIEW !== "1", "Requires an explicitly opted-in isolated database");
  process.loadEnvFile(".env.local");
  const meta = JSON.parse(readFileSync(".harness/worktree.json", "utf8")) as {
    id: string;
    portBase: number;
  };
  const url = new URL(process.env.DATABASE_URL ?? "");
  if (
    meta.id !== "TICKET-047" ||
    url.port !== String(meta.portBase + 1) ||
    !["localhost", "127.0.0.1"].includes(url.hostname)
  )
    throw new Error("Wrong isolated database");
  const db = postgres(url.toString(), { max: 1 });
  const tokens = [randomBytes(32).toString("base64url"), randomBytes(32).toString("base64url")];
  const ids: string[] = [];
  const context = await browser.newContext({
    baseURL,
    userAgent: "WhatsApp/2.24.1",
    javaScriptEnabled: false,
  });
  const page = await context.newPage();
  try {
    const snapshots = [];
    for (const [index, token] of tokens.entries()) {
      const name = "Private Guest " + index;
      const [row] =
        await db`insert into invitations(token,household_name,status) values(${token}, ${name}, 'sent') returning id`;
      if (!row) throw new Error("Fixture insert failed");
      ids.push(String(row.id));
      await db`insert into guests(invitation_id,name,is_primary) values(${row.id},${name},true)`;
      const response = await page.goto("/i/" + token);
      expect(response?.status()).toBe(200);
      const tags = await page.locator("meta").evaluateAll((nodes) =>
        nodes.map((node) => ({
          name: node.getAttribute("name"),
          property: node.getAttribute("property"),
          content: node.getAttribute("content"),
        })),
      );
      const serialized = JSON.stringify(tags);
      expect(serialized).not.toContain(token);
      expect(serialized).not.toContain(name);
      expect(serialized).not.toContain(String(row.id));
      expect(await page.locator('meta[property="og:image"]').getAttribute("content")).toMatch(
        /\/invitation-preview$/,
      );
      snapshots.push(tags.sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))));
    }
    expect(snapshots[0]).toEqual(snapshots[1]);
  } finally {
    await context.close();
    try {
      if (ids.length) await db`delete from invitations where id in ${db(ids)}`;
    } finally {
      await db.end();
    }
  }
});
