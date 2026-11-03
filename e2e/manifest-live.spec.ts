import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import postgres from "postgres";
import { getTheme } from "../src/modules/theming";

test("manifest follows stored public names and theme without rebuilding", async ({ request }) => {
  test.skip(process.env.RUN_MANIFEST_LIVE !== "1", "Explicit isolated database opt-in required");
  test.setTimeout(65000);
  process.loadEnvFile(".env.local");
  const meta = JSON.parse(readFileSync(".harness/worktree.json", "utf8")) as {
    id: string;
    portBase: number;
  };
  const url = new URL(process.env.DATABASE_URL ?? "");
  if (
    meta.id !== "TICKET-103" ||
    url.port !== String(meta.portBase + 1) ||
    !["localhost", "127.0.0.1"].includes(url.hostname)
  )
    throw new Error("Wrong isolated manifest database");
  const db = postgres(url.toString(), { max: 1 });
  const marker = "TICKET-103 manifest browser fixture";
  let created = false;
  try {
    if ((await db`select id from event_settings`).length)
      throw new Error("Manifest fixture requires an empty isolated settings table");
    const rows =
      await db`insert into event_settings(id,couple_names,venue,active_theme_id) values(1,ARRAY['Manifest','Fixture'],${marker},'ivory-gold') on conflict do nothing returning id`;
    if (rows.length !== 1) throw new Error("Could not own settings fixture");
    created = true;
    const before = await (await request.get("/manifest.webmanifest")).json();
    expect(before.name).toBe("Manifest & Fixture — Our wedding");
    await db`update event_settings set couple_names=ARRAY['Updated','Names'],active_theme_id='blush-sage' where id=1 and venue=${marker}`;
    await expect
      .poll(async () => (await (await request.get("/manifest.webmanifest")).json()).theme_color, {
        timeout: 45000,
        intervals: [1000],
      })
      .toBe(getTheme("blush-sage").colors.primary);
    const after = await (await request.get("/manifest.webmanifest")).json();
    expect(after.name).toBe("Updated & Names — Our wedding");
    expect(after.background_color).toBe(getTheme("blush-sage").colors.background);
    expect([after.id, after.scope, after.start_url]).toEqual(["/", "/", "/"]);
    expect(JSON.stringify(after)).not.toContain(marker);
  } finally {
    try {
      if (created) await db`delete from event_settings where id=1 and venue=${marker}`;
    } finally {
      await db.end();
    }
  }
});
