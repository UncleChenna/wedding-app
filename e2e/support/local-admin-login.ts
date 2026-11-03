import { readFileSync } from "node:fs";
import { expect, type Page, type APIRequestContext } from "@playwright/test";
import { z } from "zod";

export async function localAdminLogin(page: Page, request: APIRequestContext, email: string) {
  process.loadEnvFile(".env.local");
  const meta = z
    .object({ portBase: z.number(), path: z.string() })
    .parse(JSON.parse(readFileSync(".harness/worktree.json", "utf8")));
  expect(meta.path).toBe(process.cwd());
  const api = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "");
  expect(api.hostname).toBe("127.0.0.1");
  expect(api.port).toBe(String(meta.portBase));
  expect((process.env.ADMIN_EMAIL_ALLOWLIST ?? "").split(",")).toContain(email);
  const mail = `http://127.0.0.1:${meta.portBase + 5}`;
  const schema = z.object({
    messages: z.array(z.object({ ID: z.string(), To: z.array(z.object({ Address: z.string() })) })),
  });
  const old = schema.parse(await (await request.get(`${mail}/api/v1/messages`)).json());
  const previous = new Set(old.messages.map((message) => message.ID));
  await page.goto("/admin/sign-in");
  await page.getByLabel("Email address").fill(email);
  await page.getByRole("button", { name: "Send code", exact: true }).click();
  await expect(page.getByLabel("Sign-in code")).toBeVisible();
  let id = "";
  await expect
    .poll(async () => {
      const inbox = schema.parse(await (await request.get(`${mail}/api/v1/messages`)).json());
      id =
        inbox.messages.find(
          (message) => !previous.has(message.ID) && message.To.some((to) => to.Address === email),
        )?.ID ?? "";
      return id;
    })
    .not.toBe("");
  const body = z
    .object({ Text: z.string() })
    .parse(await (await request.get(`${mail}/api/v1/message/${id}`)).json());
  const code = body.Text.match(/\b\d{6,8}\b/)?.[0];
  if (!code) throw new Error("Local OTP mail missing");
  await page.getByLabel("Sign-in code").fill(code);
  await page.getByRole("button", { name: "Verify code" }).click();
  await expect(page.getByRole("status", { name: "Account status" })).toHaveText(
    "You’re signed in.",
  );
}
