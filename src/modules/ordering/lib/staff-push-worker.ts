/** Kept as standalone source so the worker never imports server transport dependencies. */
export const staffPushWorkerSource = String.raw`
self.addEventListener("push", (event) => {
  let message;
  try { message = event.data && event.data.json(); } catch { return; }
  if (!message || message.type !== "station-order" || !["kitchen", "bar"].includes(message.station)) return;
  const station = message.station;
  event.waitUntil(self.registration.showNotification("New " + station + " orders", {
    body: "Open the board to see the latest orders.",
    tag: "wedding-" + station + "-orders",
    icon: "/icons/ivory-gold/any-192.png",
    data: { station },
  }));
});
self.addEventListener("notificationclick", (event) => {
  const station = event.notification.data && event.notification.data.station;
  if (!["kitchen", "bar"].includes(station)) return;
  event.notification.close();
  const url = new URL("/" + station, self.location.origin).href;
  event.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(async (windows) => {
    const existing = windows.find((client) => client.url === url);
    if (existing) return existing.focus();
    return self.clients.openWindow(url);
  }));
});
`;
