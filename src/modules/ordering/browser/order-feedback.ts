/** Small native-document equivalent of the React toast. Never inserts result HTML. */
export function createOrderFeedback(parent: HTMLElement) {
  const region = document.createElement("div");
  region.className = "order-feedback";
  const polite = document.createElement("div");
  polite.setAttribute("role", "status");
  const alert = document.createElement("div");
  alert.setAttribute("role", "alert");
  region.append(polite, alert);
  parent.append(region);
  let timer: ReturnType<typeof setTimeout> | undefined;
  const dismiss = () => {
    clearTimeout(timer);
    polite.replaceChildren();
    alert.replaceChildren();
  };
  return {
    notify(message: string, error = false) {
      dismiss();
      const card = document.createElement("div");
      card.className = "order-feedback-card";
      const text = document.createElement("p");
      text.textContent = message;
      const close = document.createElement("button");
      close.type = "button";
      close.textContent = "Dismiss";
      close.setAttribute("aria-label", "Dismiss notification");
      close.addEventListener("click", dismiss);
      card.append(text, close);
      (error ? alert : polite).append(card);
      if (!error) timer = setTimeout(dismiss, 6000);
    },
    dispose() {
      dismiss();
      region.remove();
    },
  };
}
