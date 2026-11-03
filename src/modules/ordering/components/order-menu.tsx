import "server-only";
import { menuCopy, type MenuItem } from "../lib/menu";
import type { MenuLoad } from "../server/menu";
import { MenuSections } from "./menu-sections";

export function OrderMenu({ menu }: { menu: MenuLoad }) {
  const items: MenuItem[] = menu.status === "ready" ? menu.items : [];
  return (
    <section aria-labelledby="order-menu" className="mt-12">
      <h2 id="order-menu" className="font-display text-3xl leading-tight md:text-4xl">
        {menuCopy.heading}
      </h2>
      <p className="mt-6 text-base leading-relaxed text-muted-foreground">{menuCopy.notOpen}</p>
      <div className="mt-12">
        {menu.status === "unavailable" ? (
          <p className="text-lg leading-relaxed">{menuCopy.unavailable}</p>
        ) : items.length === 0 ? (
          <p className="text-lg leading-relaxed">{menuCopy.empty}</p>
        ) : (
          <MenuSections items={items} />
        )}
      </div>
    </section>
  );
}
