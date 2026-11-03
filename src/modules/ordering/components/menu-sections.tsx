"use client";
import { useEffect, useRef, useState } from "react";
import { QuantityStepper } from "@/modules/shared/components/ui";
import {
  groupMenu,
  MENU_POLL_INTERVAL_MS,
  menuAvailabilitySchema,
  menuCopy,
  type MenuItem,
} from "../lib/menu";

export const MENU_AVAILABILITY_URL = "/api/menu/availability";

export function MenuSections({
  items,
  pollIntervalMs = MENU_POLL_INTERVAL_MS,
}: {
  items: MenuItem[];
  pollIntervalMs?: number;
}) {
  const [available, setAvailable] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(items.map((item) => [item.id, item.available])),
  );
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [announcement, setAnnouncement] = useState("");
  const current = useRef(available);

  useEffect(() => {
    const names = new Map(items.map((item) => [item.id, item.name]));
    let cancelled = false;
    let inFlight = false;
    async function poll() {
      if (inFlight || document.visibilityState === "hidden") return;
      inFlight = true;
      try {
        const response = await fetch(MENU_AVAILABILITY_URL, { cache: "no-store" });
        if (!response.ok) return;
        const parsed = menuAvailabilitySchema.safeParse(await response.json());
        if (!parsed.success || cancelled) return;
        const next = { ...current.current };
        const soldOut: string[] = [];
        const restocked: string[] = [];
        for (const { id, available } of parsed.data.items) {
          // Items added after the page loaded wait for a reload; only known items change state.
          if (!(id in next) || next[id] === available) continue;
          next[id] = available;
          (available ? restocked : soldOut).push(id);
        }
        if (!soldOut.length && !restocked.length) return;
        current.current = next;
        setAvailable(next);
        if (soldOut.length)
          // Sold-out items leave the guest's choices; the server still rechecks at submission.
          setQuantities((quantities) => {
            const kept = { ...quantities };
            for (const id of soldOut) delete kept[id];
            return kept;
          });
        setAnnouncement(
          [
            ...soldOut.map((id) => menuCopy.justSoldOut(names.get(id) ?? "")),
            ...restocked.map((id) => menuCopy.backInStock(names.get(id) ?? "")),
          ].join(" "),
        );
      } catch {
        // Keep the last known state; the next poll retries.
      } finally {
        inFlight = false;
      }
    }
    const timer = setInterval(() => void poll(), pollIntervalMs);
    const onVisible = () => {
      if (document.visibilityState === "visible") void poll();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [items, pollIntervalMs]);

  return (
    <div>
      <p role="status" className="sr-only">
        {announcement}
      </p>
      {groupMenu(items).map((section) => (
        <section
          key={section.category}
          aria-labelledby={`menu-${section.category}`}
          className="mt-12 first:mt-0"
        >
          <h3 id={`menu-${section.category}`} className="type-label text-primary">
            {section.label}
          </h3>
          <ul className="mt-6 space-y-8">
            {section.items.map((item) => {
              const isAvailable = available[item.id] ?? false;
              return (
                <li key={item.id} className="border-b border-border pb-8">
                  <h4 className="font-display text-2xl leading-snug">{item.name}</h4>
                  {item.description && (
                    <p className="mt-2 text-base leading-relaxed text-muted-foreground">
                      {item.description}
                    </p>
                  )}
                  {item.dietaryTags.length > 0 && (
                    <p className="mt-2 text-base leading-relaxed">{item.dietaryTags.join(" · ")}</p>
                  )}
                  <div className="mt-4">
                    <QuantityStepper
                      id={`menu-quantity-${item.id}`}
                      label={`${item.name} quantity`}
                      min={0}
                      max={item.maxPerOrder}
                      value={isAvailable ? (quantities[item.id] ?? 0) : 0}
                      disabled={!isAvailable}
                      hint={isAvailable ? undefined : menuCopy.soldOut}
                      onValueChange={(value) =>
                        setQuantities((quantities) => ({ ...quantities, [item.id]: value }))
                      }
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
