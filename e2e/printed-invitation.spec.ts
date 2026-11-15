import { expect, test } from "@playwright/test";

test("original card preview links to online RSVP without sending a reply", async ({
  page,
  request,
}) => {
  await page.goto("/dev/invitation");
  await expect(
    page.getByRole("heading", { name: "Your invitation card", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("For Sample household · Card 003")).toBeVisible();
  await expect(page.getByRole("link", { name: "View ceremony venue" })).toHaveAttribute(
    "href",
    /maps/,
  );
  await page.getByRole("link", { name: "RSVP online", exact: true }).click();
  await expect(page).toHaveURL(/#preview-reply$/);
  await expect(page.getByText(/This sample does not save a reply/)).toBeVisible();
  const pdf = await request.get("/dev/invitation/card.pdf");
  expect(pdf.status()).toBe(200);
  expect(pdf.headers()["cache-control"]).toContain("no-store");
  expect((await pdf.body()).subarray(0, 5).toString()).toBe("%PDF-");
});
