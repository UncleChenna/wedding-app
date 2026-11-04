import { MENU_CATEGORIES } from "@/modules/ordering/lib/menu";
import { menuAdminCopy, STATION_OPTIONS } from "../lib/menu-item";
import { requireAdminPageAccess } from "../server/current-admin-access";
import { listAdminMenu } from "../server/menu-repository";
import { MenuItemActions } from "./menu-item-actions";
import { MenuItemForm } from "./menu-item-form";

const stationLabel = Object.fromEntries(STATION_OPTIONS.map((o) => [o.value, o.label]));

/** ADM-4: the couple's menu, with a live sold-out toggle (TICKET-095). */
export async function AdminMenu() {
  await requireAdminPageAccess();
  const items = await listAdminMenu();
  // Same headings as the guest menu (Meals, Soft drinks, Alcoholic drinks).
  const sections = MENU_CATEGORIES.map((category) => ({
    ...category,
    items: items.filter((item) => item.category === category.value),
  })).filter((section) => section.items.length > 0);
  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-12 text-lg leading-relaxed">
      <h1 className="font-display text-4xl leading-tight md:text-5xl">{menuAdminCopy.heading}</h1>
      <p className="mt-6 max-w-prose">{menuAdminCopy.intro}</p>
      {sections.length === 0 && <p className="mt-12">{menuAdminCopy.empty}</p>}
      {sections.map((section) => (
        <section
          key={section.value}
          aria-labelledby={`admin-menu-${section.value}`}
          className="mt-12"
        >
          <h2 id={`admin-menu-${section.value}`} className="type-label text-primary">
            {section.label}
          </h2>
          <ul className="mt-6 space-y-8">
            {section.items.map((item) => (
              <li key={item.id} className="border-b border-border pb-8">
                <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
                  <h3 className="font-display text-2xl leading-snug">{item.name}</h3>
                  {/* State in words, never colour alone (design principles §9, §11). */}
                  <p className="font-medium">
                    {item.available ? menuAdminCopy.available : menuAdminCopy.soldOut}
                  </p>
                </div>
                <p className="mt-2 text-muted-foreground">
                  {[
                    stationLabel[item.station],
                    `up to ${item.maxPerOrder} per order`,
                    ...item.dietaryTags,
                  ].join(" · ")}
                </p>
                <div className="mt-4">
                  <MenuItemActions id={item.id} name={item.name} available={item.available} />
                </div>
                <details className="mt-4">
                  <summary className="inline-flex min-h-11 cursor-pointer items-center text-primary underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">
                    Edit {item.name}
                  </summary>
                  <div className="mt-6">
                    <MenuItemForm item={item} />
                  </div>
                </details>
              </li>
            ))}
          </ul>
        </section>
      ))}
      <section aria-labelledby="admin-menu-add" className="mt-16">
        <h2 id="admin-menu-add" className="font-display text-3xl leading-tight">
          {menuAdminCopy.add}
        </h2>
        <div className="mt-6">
          <MenuItemForm />
        </div>
      </section>
    </main>
  );
}
