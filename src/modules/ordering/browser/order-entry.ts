import { menuAvailabilitySchema, menuCopy, MENU_POLL_INTERVAL_MS } from "../lib/menu";
import { orderCopy, cooldownMessage } from "../lib/order-contract";
import { submitOrder, newRequestId } from "../lib/submit-order";
import { splitByStation, type Station } from "../lib/stations";
import { orderStatusSchema, orderStatusCopy, nextPollMs, isSettled } from "../lib/order-status";

// The document owns markup; these small adapters reuse the same request/retry and
// response schemas as the React preview and station clients.
if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator)
  void navigator.serviceWorker
    .register("/sw.js", { scope: "/", updateViaCache: "none" })
    .catch(() => {});

function required<T extends Element>(selector: string, parent: ParentNode = document): T {
  const found = parent.querySelector<T>(selector);
  if (!found) throw new Error("Order document control is missing");
  return found;
}
function text(tag: string, value: string, className = ""): HTMLElement {
  const element = document.createElement(tag);
  element.textContent = value;
  element.className = className;
  return element;
}

const composer = document.querySelector<HTMLElement>("#composer");
if (composer) startComposer(composer);

function startComposer(root: HTMLElement) {
  const table = Number(root.dataset.table);
  const editing = required<HTMLElement>("#editing", root);
  const closed = required<HTMLElement>("#closed", root);
  const receipt = required<HTMLElement>("#receipt", root);
  const status = required<HTMLElement>("#order-status", root);
  const notice = required<HTMLElement>("#availability-notice", root);
  const send = required<HTMLButtonElement>("#send-order", root);
  const note = required<HTMLTextAreaElement>("#order-note", root);
  const rows = [...root.querySelectorAll<HTMLElement>("[data-item]")].map((element) => ({
    id: element.dataset.item ?? "",
    name: element.dataset.name ?? "",
    station: element.dataset.station as Station,
    element,
    input: required<HTMLInputElement>("input", element),
    buttons: [...element.querySelectorAll<HTMLButtonElement>("[data-delta]")],
    available: element.dataset.available === "true",
  }));
  let open = root.dataset.open === "true";
  let sending = false;
  let feedback: string | undefined;
  let sent = false;
  let failed = false;
  let limited = false;
  let requestId: string | null = null;
  let retryAt = 0;
  let generation = 0;
  let polling = false;
  let stopped = false;
  const timers = new Set<ReturnType<typeof setTimeout>>();
  const later = (fn: () => void, ms: number) => {
    const timer = setTimeout(() => {
      timers.delete(timer);
      if (!stopped) fn();
    }, ms);
    timers.add(timer);
  };
  const lines = () =>
    rows
      .filter((row) => row.available && Number(row.input.value) > 0)
      .map((row) => ({
        id: row.id,
        name: row.name,
        station: row.station,
        quantity: Number(row.input.value),
      }));
  function render(message?: string) {
    if (message !== undefined) feedback = message;
    editing.hidden = sent || !open;
    closed.hidden = sent || open;
    receipt.hidden = !sent;
    const count = lines().reduce((sum, row) => sum + row.quantity, 0);
    const seconds = Math.max(0, Math.ceil((retryAt - Date.now()) / 1000));
    for (const row of rows) {
      row.input.disabled = sending || !row.available;
      if (row.available) row.input.removeAttribute("aria-describedby");
      else row.input.setAttribute("aria-describedby", `sold-out-${row.id}`);
      for (const button of row.buttons)
        button.disabled =
          row.input.disabled ||
          (Number(button.dataset.delta) < 0
            ? Number(row.input.value) <= 0
            : Number(row.input.value) >= Number(row.input.max));
      required<HTMLElement>("[data-sold-out]", row.element).hidden = row.available;
    }
    note.readOnly = sending;
    send.disabled = sending || !count || seconds > 0;
    send.setAttribute("aria-busy", String(sending));
    send.textContent = sending
      ? orderCopy.sendingButton
      : failed
        ? orderCopy.retry
        : orderCopy.send;
    status.textContent =
      feedback ??
      (seconds > 0
        ? `Please wait ${seconds} ${seconds === 1 ? "second" : "seconds"} before trying again. Your choices are still here.`
        : failed
          ? limited
            ? "You can try again now. Your choices are still here."
            : orderCopy.failed
          : count
            ? `${count} ${count === 1 ? "item" : "items"} in your order.`
            : orderCopy.emptyCart);
  }
  function edit() {
    requestId = null;
    feedback = undefined;
    failed = false;
    limited = false;
    render();
  }
  for (const row of rows) {
    const commit = (value: number) => {
      row.input.value = String(
        Math.max(
          0,
          Math.min(Number(row.input.max), Number.isFinite(value) ? Math.trunc(value) : 0),
        ),
      );
      edit();
    };
    row.input.addEventListener("change", () => commit(Number(row.input.value)));
    row.input.addEventListener("keydown", (event) => {
      const moves: Record<string, number> = {
        ArrowUp: Number(row.input.value) + 1,
        ArrowDown: Number(row.input.value) - 1,
        Home: 0,
        End: Number(row.input.max),
      };
      const next = moves[event.key];
      if (next !== undefined) {
        event.preventDefault();
        commit(next);
      }
    });
    for (const button of row.buttons)
      button.addEventListener("click", () => {
        commit(Number(row.input.value) + Number(button.dataset.delta));
        if (button.disabled) row.input.focus();
      });
  }
  note.addEventListener("input", edit);
  function apply(changes: readonly { id: string; available: boolean }[]) {
    const messages: string[] = [];
    for (const change of changes) {
      const row = rows.find((item) => item.id === change.id);
      if (!row || row.available === change.available) continue;
      row.available = change.available;
      if (!row.available) {
        row.input.value = "0";
        requestId = null;
      }
      messages.push(
        row.available ? menuCopy.backInStock(row.name) : menuCopy.justSoldOut(row.name),
      );
    }
    if (messages.length) notice.textContent = messages.join(" ");
    render();
  }
  async function pollMenu() {
    if (polling || document.visibilityState === "hidden") return;
    polling = true;
    try {
      const response = await fetch("/api/menu/availability", { cache: "no-store" });
      const parsed = menuAvailabilitySchema.safeParse(response.ok ? await response.json() : null);
      if (!parsed.success || stopped) return;
      apply(parsed.data.items);
      if (open !== parsed.data.open) {
        open = parsed.data.open;
        notice.textContent = open ? menuCopy.reopened : menuCopy.paused;
        render();
      }
    } catch {
      /* Keep known availability until the next poll. */
    } finally {
      polling = false;
    }
  }
  function scheduleMenu() {
    later(() => {
      void pollMenu();
      scheduleMenu();
    }, MENU_POLL_INTERVAL_MS);
  }
  const visible = () => {
    if (document.visibilityState === "visible") void pollMenu();
  };
  document.addEventListener("visibilitychange", visible);
  scheduleMenu();

  send.addEventListener("click", () => {
    void submit();
  });
  async function submit() {
    const snapshot = lines();
    if (sending || !snapshot.length || !open || Date.now() < retryAt) return;
    requestId ??= newRequestId();
    sending = true;
    const trimmedNote = note.value.trim();
    render(orderCopy.sending);
    const result = await submitOrder(
      {
        clientRequestId: requestId,
        table,
        items: snapshot.map((row) => ({ menuItemId: row.id, quantity: row.quantity })),
        note: trimmedNote,
      },
      {
        fetch: (...args) => fetch(...args),
        sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
        onAttempt: (attempt) => render(attempt > 1 ? orderCopy.slow : orderCopy.sending),
      },
    );
    if (stopped) return;
    sending = false;
    feedback = undefined;
    if (result.status === "sent") {
      requestId = null;
      sent = true;
      failed = false;
      const container = required<HTMLElement>("#receipt-lines", root);
      container.replaceChildren();
      for (const group of splitByStation(snapshot)) {
        const section = text("section", "", "receipt-group");
        const heading = text("h4", group.label, "label");
        heading.id = `order-sent-${group.station}`;
        section.append(heading);
        const list = document.createElement("ul");
        list.setAttribute("aria-labelledby", heading.id);
        for (const row of group.items) {
          const item = text("li", "", "receipt-line");
          item.append(text("span", row.name), text("span", `× ${row.quantity}`));
          list.append(item);
        }
        section.append(list);
        const live = text("p", orderStatusCopy.checking);
        live.setAttribute("aria-live", "polite");
        live.dataset.station = group.station;
        live.dataset.stationStatus = "checking";
        section.append(live);
        container.append(section);
      }
      required<HTMLElement>("#receipt-note", root).textContent = trimmedNote
        ? `Your note: ${trimmedNote}`
        : "";
      render();
      required<HTMLElement>("#order-sent", root).focus();
      void pollStatus(result.orderId, ++generation, 0);
    } else if (result.status === "failed") {
      failed = true;
      render();
    } else if (result.status === "limited") {
      failed = true;
      limited = true;
      retryAt = Date.now() + result.retryAfterSeconds * 1000;
      const tick = () => {
        render();
        if (Date.now() < retryAt) later(tick, 1000);
      };
      tick();
    } else {
      requestId = null;
      failed = false;
      const { reason, itemIds = [], retryAfterSeconds } = result.result;
      if (reason === "sold-out") apply(itemIds.map((id) => ({ id, available: false })));
      if (reason === "closed") open = false;
      render(
        reason === "cooldown" && retryAfterSeconds
          ? cooldownMessage(retryAfterSeconds)
          : orderCopy.rejected[reason],
      );
    }
  }
  async function pollStatus(id: string, version: number, failures: number) {
    let retry: number | undefined;
    try {
      const response = await fetch(`/api/orders/${id}/status`, { cache: "no-store" });
      if (response.status === 429) retry = Number(response.headers.get("Retry-After")) || 5;
      const parsed = orderStatusSchema.safeParse(response.ok ? await response.json() : null);
      if (stopped || generation !== version) return;
      if (parsed.success) {
        failures = 0;
        for (const row of parsed.data.stations) {
          const target = root.querySelector<HTMLElement>(
            `[data-station="${row.station}"][data-station-status]`,
          );
          if (target) {
            target.textContent = orderStatusCopy[row.status];
            target.dataset.stationStatus = row.status;
          }
        }
        if (isSettled(parsed.data)) return;
      } else failures++;
    } catch {
      failures++;
    }
    if (stopped || generation !== version) return;
    if (failures >= 2)
      for (const target of root.querySelectorAll<HTMLElement>("[data-station-status]"))
        if (
          target.dataset.stationStatus !== "served" &&
          !target.textContent?.includes(orderStatusCopy.paused)
        )
          target.append(text("span", orderStatusCopy.paused));
    later(() => void pollStatus(id, version, failures), nextPollMs(failures, retry));
  }
  required<HTMLButtonElement>("#another-order", root).addEventListener("click", () => {
    generation++;
    feedback = undefined;
    sent = false;
    failed = false;
    requestId = null;
    note.value = "";
    for (const row of rows) row.input.value = "0";
    render();
    rows.find((row) => row.available)?.input.focus();
  });
  window.addEventListener("pagehide", (event) => {
    if (event.persisted) return;
    stopped = true;
    generation++;
    for (const timer of timers) clearTimeout(timer);
    document.removeEventListener("visibilitychange", visible);
  });
  render();
}
