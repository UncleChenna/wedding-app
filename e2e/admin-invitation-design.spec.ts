import { randomBytes } from "node:crypto";
import { mkdirSync } from "node:fs";
import postgres, { type Sql } from "postgres";
import sharp from "sharp";
import { expect, test } from "@playwright/test";
import { assertDatabaseTarget } from "../scripts/database-target";
import { signInAdmin, adminTestEmail } from "./support/admin-session";
import { scanA11y } from "./support/axe";
import { themes } from "../src/modules/theming/themes";
import { applyTheme } from "./support/theme";

test.describe("invitation design publication", () => {
  test.skip(process.env.RUN_INVITATION_DESIGN_E2E !== "1", "Requires isolated Auth and database");
  test.setTimeout(180_000);
  let database: Sql;
  let invitationId: string | undefined;
  let photoId: string | undefined;
  const token = randomBytes(32).toString("base64url");
  test.beforeAll(async () => {
    process.loadEnvFile(".env.local");
    assertDatabaseTarget(process.env.DATABASE_URL ?? "", { localOnly: true });
    database = postgres(process.env.DATABASE_URL ?? "", { max: 1 });
    if ((await database`select id from invitation_design`).length)
      throw new Error("Requires empty owned design fixture");
    const [row] = await database<
      { id: string }[]
    >`insert into invitations(token,household_name,status) values(${token},'Synthetic editor household','sent') returning id`;
    invitationId = row?.id;
  });
  test.afterAll(async () => {
    if (!database) return;
    try {
      if (photoId) {
        await database`delete from invitation_design where photo_id=${photoId}`;
        await database`delete from invitation_photos where id=${photoId}`;
      }
      if (invitationId)
        await database`update invitations set status='revoked' where id=${invitationId} and token=${token}`;
    } finally {
      await database.end();
    }
  });
  test("uploads privately, saves, and shows the saved design to a guest", async ({
    page,
    request,
    browser,
    baseURL,
  }, info) => {
    await page.setViewportSize({ width: info.project.name === "mobile" ? 375 : 1280, height: 812 });
    await signInAdmin(page, request, adminTestEmail(info.project.name, "design"));
    await page.goto("/admin/design");
    await page.getByLabel("Headline", { exact: true }).fill("Together for our favourite day");
    await page
      .getByLabel("Upload a photo")
      .setInputFiles({ name: "bad.svg", mimeType: "image/svg+xml", buffer: Buffer.from("<svg/>") });
    await expect(page.getByText("Choose a JPEG, PNG or WebP photo.")).toBeVisible();
    await expect(page.getByLabel("Headline", { exact: true })).toHaveValue(
      "Together for our favourite day",
    );
    const bytes = await sharp({
      create: { width: 800, height: 1000, channels: 3, background: "#a16a45" },
    })
      .jpeg()
      .toBuffer();
    const uploaded = page.waitForResponse(
      (response) =>
        response.url().endsWith("/api/admin/photos") && response.request().method() === "POST",
    );
    await page
      .getByLabel("Upload a photo")
      .setInputFiles({ name: "synthetic-photo.jpg", mimeType: "image/jpeg", buffer: bytes });
    const response = await uploaded;
    expect(response.ok()).toBe(true);
    const asset = (await response.json()) as { id: string };
    photoId = asset.id;
    expect((await request.get(`/media/invitation/${photoId}`)).status()).toBe(404);
    await page
      .getByLabel("Photo description")
      .fill("Synthetic warm brown artwork for the editor test");
    await page.getByLabel("Invitation message").fill("We would love to celebrate with you.");
    const stale = await page.context().newPage();
    await stale.goto("/admin/design");
    await page.getByRole("button", { name: "Save invitation design", exact: true }).click();
    await expect(page.getByText("Your invitation design is saved.")).toBeVisible();
    expect((await request.get(`/media/invitation/${photoId}`)).status()).toBe(200);
    await stale.getByLabel("Headline", { exact: true }).fill("Keep my unsaved wording");
    await stale.getByRole("button", { name: "Save invitation design", exact: true }).click();
    await expect(stale.locator("form").getByRole("alert")).toContainText(
      "changed in another window",
    );
    await expect(stale.getByLabel("Headline", { exact: true })).toHaveValue(
      "Keep my unsaved wording",
    );
    await stale.close();
    await page.reload();
    await expect(page.getByLabel("Headline", { exact: true })).toHaveValue(
      "Together for our favourite day",
    );
    const saveButton = page.getByRole("button", { name: "Save invitation design", exact: true });
    await saveButton.focus();
    await expect(saveButton).toBeFocused();
    const buttonBox = await saveButton.boundingBox();
    const navigationBox = await page.getByRole("navigation", { name: "Admin" }).boundingBox();
    expect(buttonBox).not.toBeNull();
    expect(navigationBox).not.toBeNull();
    if (info.project.name === "mobile" && buttonBox && navigationBox)
      expect(buttonBox.y + buttonBox.height).toBeLessThanOrEqual(navigationBox.y);
    await page.keyboard.press("Enter");
    await expect(page.getByText("Your invitation design is saved.")).toBeVisible();
    mkdirSync(`artifacts/TICKET-099/${info.project.name}`, { recursive: true });
    for (const theme of themes) {
      await applyTheme(page, theme);
      expect(await scanA11y(page)).toEqual([]);
      await page.screenshot({
        path: `artifacts/TICKET-099/${info.project.name}/${theme.id}.png`,
        fullPage: true,
      });
    }
    const guest = await browser.newContext({ baseURL });
    try {
      const invitation = await guest.newPage();
      await invitation.goto(`/i/${token}`);
      await expect(
        invitation.getByText("Together for our favourite day", { exact: true }),
      ).toBeVisible();
      await expect(
        invitation.getByAltText("Synthetic warm brown artwork for the editor test"),
      ).toBeVisible();
    } finally {
      await guest.close();
    }
  });
});
