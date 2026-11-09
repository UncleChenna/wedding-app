import postgres, { type Sql } from "postgres";
import sharp from "sharp";
import { expect, test } from "@playwright/test";
import { assertDatabaseTarget } from "../scripts/database-target";
import { signInAdmin } from "./support/admin-session";

test.describe("private admin photo pipeline", () => {
  test.skip(
    process.env.RUN_PHOTO_JOURNEY !== "1",
    "Requires isolated local Auth and synthetic admin allowlist",
  );
  test.setTimeout(120_000);
  let database: Sql;
  const assets: string[] = [];
  test.beforeAll(() => {
    process.loadEnvFile(".env.local");
    const url = process.env.DATABASE_URL ?? "";
    assertDatabaseTarget(url, { localOnly: true });
    database = postgres(url, { max: 1 });
  });
  test.afterAll(async () => {
    if (!database) return;
    try {
      for (const id of assets) await database`delete from invitation_photos where id = ${id}`;
    } finally {
      await database.end();
    }
  });
  test("real two-step admin uploads and privately retrieves normalized pixels", async ({
    page,
    request,
    baseURL,
  }, info) => {
    const bytes = await sharp({
      create: { width: 80, height: 40, channels: 3, background: "ivory" },
    })
      .withMetadata({ orientation: 6 })
      .jpeg()
      .toBuffer();
    const headers = { "content-type": "image/jpeg", origin: baseURL ?? "" };
    expect((await request.post("/api/admin/photos", { headers, data: bytes })).status()).toBe(403);
    const prefix = process.env.PHOTO_TEST_PREFIX;
    if (!prefix) throw new Error("Use the isolated photo test runner");
    await signInAdmin(page, request, `${prefix}-${info.project.name}@example.test`);
    const upload = await page.request.post("/api/admin/photos", { headers, data: bytes });
    expect(upload.status()).toBe(201);
    const asset = (await upload.json()) as {
      id: string;
      width: number;
      height: number;
      blurDataURL: string;
    };
    assets.push(asset.id);
    expect(asset).toMatchObject({ width: 40, height: 80, mime: "image/webp" });
    expect(asset.blurDataURL).toMatch(/^data:image\/webp;base64,/);
    const saved = await page.request.get(`/api/admin/photos/${asset.id}`);
    expect(saved.status()).toBe(200);
    const metadata = await sharp(await saved.body()).metadata();
    expect(metadata).toMatchObject({ width: 40, height: 80, format: "webp" });
    expect(metadata.exif).toBeUndefined();
    expect((await request.get(`/api/admin/photos/${asset.id}`)).status()).toBe(403);
    expect(
      (
        await page.request.post("/api/admin/photos", {
          headers: { ...headers, origin: "https://elsewhere.test" },
          data: bytes,
        })
      ).status(),
    ).toBe(403);
  });
});
