import { beforeEach, expect, it, vi } from "vitest";
import { PgDialect } from "drizzle-orm/pg-core";
import { drizzle } from "drizzle-orm/postgres-js";
import { defaultEventSettings } from "@/modules/shared/lib/event-settings";
const mocks = vi.hoisted(() => ({ authorize: vi.fn(), select: vi.fn(), settings: vi.fn() }));
vi.mock("../server/current-admin-access", () => ({ requireAdminPageAccess: mocks.authorize }));
vi.mock("@/modules/shared/server/db/client", () => ({ db: { select: mocks.select } }));
vi.mock("@/modules/shared/server/settings", () => ({ getEventSettings: mocks.settings }));
vi.mock("@/modules/shared/lib/env/client", () => ({
  clientEnv: { NEXT_PUBLIC_SITE_URL: "https://wedding.example/" },
}));
import { getReminders } from "../server/reminders";
import { readReminderRows } from "../server/reminder-repository";
beforeEach(() => {
  vi.resetAllMocks();
  mocks.settings.mockResolvedValue(defaultEventSettings);
});
it("builds the exact sent/no-RSVP query and ignores undone and old-version events", () => {
  const query = readReminderRows(drizzle.mock());
  const sql = new PgDialect().sqlToQuery(query.getSQL());
  expect(sql.sql).toContain('left join "rsvps"');
  expect(sql.sql).toContain('"rsvps"."id" is null');
  expect(sql.sql).toContain('"invitations"."status" = $1');
  expect(sql.params).toContain("sent");
  expect(sql.sql).toContain("e.undone_at is null");
  expect(sql.sql).toContain('e.token_version = "invitations"."token_version"');
});
it("authorizes before exposing bearer URLs", async () => {
  mocks.authorize.mockRejectedValue(new Error("redirect"));
  await expect(getReminders()).rejects.toThrow("redirect");
  expect(mocks.select).not.toHaveBeenCalled();
  expect(mocks.settings).not.toHaveBeenCalled();
});
it("reports failure without exposing database details or claiming an empty list", async () => {
  mocks.select.mockImplementation(() => {
    throw new Error("private token");
  });
  expect(await getReminders()).toEqual({
    status: "error",
    message: "We couldn't load the reminder list. Please try again.",
  });
});
