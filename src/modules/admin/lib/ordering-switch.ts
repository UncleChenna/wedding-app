export type OrderingSwitchState =
  | { status: "idle" }
  | { status: "saved"; open: boolean; message: string }
  | { status: "error"; message: string };

export const orderingSwitchCopy = {
  heading: "Table ordering",
  open: "Ordering is open. Guests can order from their table.",
  closed: "Ordering is closed. Guests see a message that it opens soon.",
  openButton: "Open ordering",
  closeButton: "Close ordering",
  opened: "Ordering is open. Order pages update within seconds.",
  closedNow: "Ordering is closed. Order pages update within seconds.",
  failed: "We couldn't change ordering just now. Please try again.",
} as const;
