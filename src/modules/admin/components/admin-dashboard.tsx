import { appRoutes } from "@/modules/shared/lib/routes";
import Link from "next/link";
import { getEventSettings } from "@/modules/shared/server/settings";
import { requireAdminPageAccess } from "../server/current-admin-access";
import { OrderingSwitch } from "./ordering-switch";

export async function AdminDashboard() {
  await requireAdminPageAccess();
  const settings = await getEventSettings();
  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-12 text-lg leading-relaxed">
      <h1 className="font-display text-4xl leading-tight md:text-5xl">Wedding control room</h1>
      <p className="mt-6 max-w-prose">Everything for your celebration, in one place.</p>
      <OrderingSwitch open={settings.orderingOpen} />
      <ul className="mt-12 grid gap-8 sm:grid-cols-2">
        {[
          {
            href: appRoutes.adminSeating.path,
            name: "Seating",
            text: "Arrange tables and keep households together.",
          },
          {
            href: appRoutes.adminGuests.path,
            name: "Guests",
            text: "Find invitations, replies and seating details.",
          },
          {
            href: appRoutes.adminThemes.path,
            name: "Themes",
            text: "Preview your colours and fonts, then publish them.",
          },
          {
            href: appRoutes.adminSharing.path,
            name: "Sharing",
            text: "Send a personal invitation or copy its link.",
          },
          {
            href: appRoutes.adminMenu.path,
            name: "Menu",
            text: "Set what guests can order and mark items sold out.",
          },
          {
            href: appRoutes.adminSettings.path,
            name: "Settings",
            text: "Names, date, venue, replies and ordering limits.",
          },
          {
            href: appRoutes.adminStaff.path,
            name: "Staff",
            text: "PINs for the gate, kitchen and bar.",
          },
          {
            href: appRoutes.adminClosure.path,
            name: "After the celebration",
            text: "Save your memories and close the event when the day is over.",
          },
        ].map((area) => (
          <li key={area.name}>
            <h2 className="font-display text-3xl">
              <Link
                href={area.href}
                className="inline-flex min-h-11 items-center text-primary underline underline-offset-4"
              >
                {area.name}
              </Link>
            </h2>
            <p className="mt-3">{area.text}</p>
          </li>
        ))}
        {["Live dashboard"].map((name) => (
          <li key={name}>
            <h2 className="font-display text-3xl">{name}</h2>
            <p className="mt-3 text-muted-foreground">Coming soon</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
