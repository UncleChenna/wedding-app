// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { StaffPushControl } from "../components/staff-push-control";

const actions = vi.hoisted(() => ({
  readStaffPushConfig: vi.fn(),
  saveStaffPush: vi.fn(),
  removeStaffPush: vi.fn(),
}));
vi.mock("../server/staff-push-actions", () => actions);
const subscribe = vi.fn();
const permission = vi.fn();
beforeEach(() => {
  vi.clearAllMocks();
  actions.readStaffPushConfig.mockResolvedValue({
    publicKey: `B${"A".repeat(86)}`,
    enabledEndpoint: null,
  });
  Object.defineProperty(navigator, "serviceWorker", {
    configurable: true,
    value: {
      getRegistration: vi.fn(async () => ({
        active: {},
        pushManager: { getSubscription: async () => null, subscribe },
      })),
    },
  });
  vi.stubGlobal("PushManager", class {});
  vi.stubGlobal("Notification", { requestPermission: permission });
});
afterEach(() => vi.unstubAllGlobals());

it("keeps the board usable when notification permission is denied", async () => {
  permission.mockResolvedValue("denied");
  render(
    <>
      <button>Serve order</button>
      <StaffPushControl station="kitchen" />
    </>,
  );
  fireEvent.click(await screen.findByRole("button", { name: "Notify me of new orders" }));
  expect(await screen.findByRole("status")).toHaveTextContent("Keep the board open");
  expect(screen.getByRole("button", { name: "Serve order" })).toBeEnabled();
  expect(subscribe).not.toHaveBeenCalled();
  expect(actions.saveStaffPush).not.toHaveBeenCalled();
});

it("does not prompt or offer notifications on an unconfigured deployment", async () => {
  permission.mockResolvedValue("granted");
  actions.readStaffPushConfig.mockResolvedValue(null);
  render(
    <>
      <button>Serve order</button>
      <StaffPushControl station="bar" />
    </>,
  );
  await waitFor(() => expect(actions.readStaffPushConfig).toHaveBeenCalled());
  expect(permission).not.toHaveBeenCalled();
  expect(screen.queryByRole("button", { name: "Notify me of new orders" })).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Serve order" })).toBeEnabled();
});

it("does not mistake an old browser subscription for the current staff session's preference", async () => {
  const current = {
    endpoint: "https://fcm.googleapis.com/old",
    options: {
      applicationServerKey: Uint8Array.from(atob(`B${"A".repeat(86)}`), (char) =>
        char.charCodeAt(0),
      ).buffer,
    },
    toJSON: () => ({ endpoint: "https://fcm.googleapis.com/old", keys: {} }),
  };
  vi.mocked(navigator.serviceWorker.getRegistration).mockResolvedValue({
    active: {},
    pushManager: { getSubscription: async () => current },
  } as unknown as ServiceWorkerRegistration);
  permission.mockResolvedValue("granted");
  actions.saveStaffPush.mockResolvedValue(true);
  render(<StaffPushControl station="kitchen" />);
  fireEvent.click(await screen.findByRole("button", { name: "Notify me of new orders" }));
  await waitFor(() =>
    expect(actions.saveStaffPush).toHaveBeenCalledWith("kitchen", current.toJSON()),
  );
  expect(await screen.findByRole("button", { name: "Turn notifications off" })).toBeEnabled();
});

it("unsubscribes a newly created browser subscription when saving fails", async () => {
  permission.mockResolvedValue("granted");
  actions.readStaffPushConfig.mockResolvedValue({ publicKey: `B${"A".repeat(86)}` });
  actions.saveStaffPush.mockResolvedValue(false);
  const unsubscribe = vi.fn(async () => true);
  subscribe.mockResolvedValue({
    toJSON: () => ({ endpoint: "https://fcm.googleapis.com/x", keys: {} }),
    unsubscribe,
  });
  render(<StaffPushControl station="kitchen" />);
  fireEvent.click(await screen.findByRole("button", { name: "Notify me of new orders" }));
  await waitFor(() => expect(unsubscribe).toHaveBeenCalledOnce());
  expect(await screen.findByRole("status")).toHaveTextContent("unavailable");
});

it("replaces an old VAPID-key subscription only after the operator opts in again", async () => {
  const unsubscribe = vi.fn(async () => true);
  const old = {
    endpoint: "https://fcm.googleapis.com/old",
    options: { applicationServerKey: new Uint8Array(65).buffer },
    unsubscribe,
  };
  vi.mocked(navigator.serviceWorker.getRegistration).mockResolvedValue({
    active: {},
    pushManager: { getSubscription: async () => old, subscribe },
  } as unknown as ServiceWorkerRegistration);
  actions.readStaffPushConfig.mockResolvedValue({
    publicKey: `B${"A".repeat(86)}`,
    enabledEndpoint: old.endpoint,
  });
  permission.mockResolvedValue("granted");
  actions.saveStaffPush.mockResolvedValue(true);
  subscribe.mockResolvedValue({
    toJSON: () => ({ endpoint: "https://fcm.googleapis.com/new", keys: {} }),
  });
  render(<StaffPushControl station="bar" />);
  const button = await screen.findByRole("button", { name: "Notify me of new orders" });
  expect(unsubscribe).not.toHaveBeenCalled();
  fireEvent.click(button);
  await waitFor(() => expect(unsubscribe).toHaveBeenCalledOnce());
  expect(await screen.findByRole("button", { name: "Turn notifications off" })).toBeEnabled();
});
