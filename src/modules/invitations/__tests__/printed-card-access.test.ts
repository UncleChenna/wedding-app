import { beforeEach, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({ rows: [] as object[], select: vi.fn() }));
vi.mock("@/modules/shared/server/db/client", () => ({ db: { select: state.select } }));
vi.mock("@/modules/shared/lib/env/client", () => ({
  clientEnv: { NEXT_PUBLIC_SITE_URL: "https://example.com" },
}));
import { readGuestCard, readAdminCard } from "../server/printed-card";
const token = "a".repeat(43);
const row = {
  cardNumber: 7,
  name: "Ada",
  householdName: "Ada’s family",
  maxTagAlongs: 1,
  token,
  status: "sent",
};
beforeEach(() => {
  state.rows = [row];
  const chain = {
    from: () => chain,
    leftJoin: () => chain,
    where: () => chain,
    orderBy: async () => state.rows,
  };
  state.select.mockReset().mockReturnValue(chain);
});
it.each(["sent", "rsvp_yes", "rsvp_no"])(
  "allows published %s cards before or after RSVP",
  async (status) => {
    state.rows = [
      { ...row, status },
      { ...row, name: "Uche", status },
    ];
    expect(await readGuestCard(token)).toMatchObject({
      cardNumber: 7,
      capacity: 3,
      rsvpUrl: `https://example.com/i/${token}#reply`,
    });
  },
);
it.each(["draft", "revoked"])(
  "does not expose %s cards through the guest token",
  async (status) => {
    state.rows = [{ ...row, status }];
    expect(await readGuestCard(token)).toBeNull();
  },
);
it("rejects malformed credentials before querying and unknown invitations", async () => {
  expect(await readGuestCard("bad")).toBeNull();
  expect(state.select).not.toHaveBeenCalled();
  state.rows = [];
  expect(await readGuestCard(token)).toBeNull();
});
it("allows admin draft previews while refusing revoked cards", async () => {
  const id = "85c796e3-8e05-483b-bb1b-6d095fd3d22e";
  state.rows = [{ ...row, status: "draft" }];
  expect(await readAdminCard(id)).toMatchObject({ status: "draft", cardNumber: 7 });
  state.rows = [{ ...row, status: "revoked" }];
  expect(await readAdminCard(id)).toBeNull();
});
