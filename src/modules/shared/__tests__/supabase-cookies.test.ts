import { describe, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({
  site: "https://wedding.example",
  create: vi.fn(),
  set: vi.fn(),
}));
vi.mock("@supabase/ssr", () => ({ createServerClient: state.create }));
vi.mock("next/headers", () => ({ cookies: async () => ({ getAll: () => [], set: state.set }) }));
vi.mock("../lib/env/client", () => ({
  clientEnv: {
    get NEXT_PUBLIC_SITE_URL() {
      return state.site;
    },
    NEXT_PUBLIC_SUPABASE_URL: "https://auth.example",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "public-fixture",
  },
}));
import { createSupabaseServerClient } from "../server/supabase/server";
describe("server Auth cookie policy", () => {
  it("requires secure httpOnly cookies for HTTPS deployments", async () => {
    state.site = "https://wedding.example";
    await createSupabaseServerClient();
    expect(state.create).toHaveBeenLastCalledWith(
      "https://auth.example",
      "public-fixture",
      expect.objectContaining({
        cookieOptions: { httpOnly: true, secure: true, sameSite: "lax", path: "/" },
      }),
    );
  });
  it("keeps local HTTP development httpOnly while permitting the local transport", async () => {
    state.site = "http://localhost:22890";
    await createSupabaseServerClient();
    expect(state.create).toHaveBeenLastCalledWith(
      "https://auth.example",
      "public-fixture",
      expect.objectContaining({
        cookieOptions: { httpOnly: true, secure: false, sameSite: "lax", path: "/" },
      }),
    );
  });
});
