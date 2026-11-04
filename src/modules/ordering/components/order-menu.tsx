import "server-only";
import { menuCopy, type MenuItem } from "../lib/menu";
import type { MenuLoad } from "../server/menu";
import { OrderComposer } from "./order-composer";

export function OrderMenu({ menu, table }: { menu: MenuLoad; table: number }) {
  const items: MenuItem[] = menu.status === "ready" ? menu.items : [];
  return (
    <section aria-labelledby="order-menu" className="mt-12">
      <h2 id="order-menu" className="font-display text-3xl leading-tight md:text-4xl">
        {menuCopy.heading}
      </h2>
      <div className="mt-12">
        {menu.status === "unavailable" ? (
          <p className="text-lg leading-relaxed">{menuCopy.unavailable}</p>
        ) : items.length === 0 ? (
          <p className="text-lg leading-relaxed">{menuCopy.empty}</p>
        ) : (
          <OrderComposer items={items} table={table} />
        )}
      </div>
    </section>
  );
}
