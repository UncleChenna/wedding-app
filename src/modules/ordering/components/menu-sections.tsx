"use client";
import { QuantityStepper } from "@/modules/shared/components/ui";
import { groupMenu, menuCopy, type MenuItem } from "../lib/menu";

/** The menu by category with a quantity choice per item. State lives in `OrderComposer`. */
export function MenuSections({
  items,
  available,
  quantities,
  onQuantityChange,
  locked = false,
}: {
  items: readonly MenuItem[];
  available: Record<string, boolean>;
  quantities: Record<string, number>;
  onQuantityChange: (id: string, quantity: number) => void;
  /** While an order is sending, choices cannot change under it. */
  locked?: boolean;
}) {
  return (
    <div>
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
                      disabled={!isAvailable || locked}
                      hint={isAvailable ? undefined : menuCopy.soldOut}
                      onValueChange={(value) => onQuantityChange(item.id, value)}
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
