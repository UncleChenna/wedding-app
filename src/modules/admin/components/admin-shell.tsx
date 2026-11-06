import type { ReactNode } from "react";
import { appRoutes } from "@/modules/shared/lib/routes";
import { AdminNavLink } from "./admin-nav-link";

/** Sections with a page today. Feature tickets add theirs here as their routes land. */
export const adminSections = [
  { href: appRoutes.admin.path, label: "Control room", exact: true },
  {
    href: appRoutes.adminLinkRequests.path,
    label: appRoutes.adminLinkRequests.label,
    exact: false,
  },
  { href: appRoutes.adminSharing.path, label: appRoutes.adminSharing.label, exact: false },
  { href: appRoutes.adminMenu.path, label: appRoutes.adminMenu.label, exact: false },
  { href: appRoutes.adminStaff.path, label: appRoutes.adminStaff.label, exact: false },
  { href: appRoutes.adminSettings.path, label: appRoutes.adminSettings.label, exact: false },
] as const;

/**
 * The protected admin frame (TICKET-088): event name, section navigation and sign-out. On phones the
 * navigation is a bar at the bottom, in thumb reach and clear of the safe area; from `md` it is a
 * sidebar. Access is checked by the protected layout before this renders.
 */
export function AdminShell({
  eventName,
  children,
  currentPath,
}: {
  eventName: string;
  children: ReactNode;
  /** Preview only: which section to show as current. Real pages use the browser path. */
  currentPath?: string;
}) {
  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      <header className="flex items-start justify-between gap-4 border-b border-border px-6 py-4 md:hidden">
        <div className="min-w-0">
          <p className="type-label text-primary">Wedding control room</p>
          <p className="mt-1 font-display text-2xl leading-tight">{eventName}</p>
        </div>
        {/* On phones the bottom bar holds the sections; sign-out sits up here, away from them. */}
        <div className="shrink-0">
          <AdminNavLink
            href={appRoutes.adminSignOut.path}
            label={appRoutes.adminSignOut.label}
            exact
            currentPath={currentPath}
          />
        </div>
      </header>
      <nav
        aria-label="Admin"
        className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] md:sticky md:top-0 md:h-dvh md:w-64 md:shrink-0 md:border-t-0 md:border-r md:px-4 md:py-8"
      >
        <div className="hidden md:block md:px-3">
          <p className="type-label text-primary">Wedding control room</p>
          <p className="mt-2 font-display text-2xl leading-tight">{eventName}</p>
        </div>
        <ul className="grid grid-cols-5 gap-1 md:mt-10 md:grid-cols-1 md:gap-2">
          {adminSections.map((section) => (
            <li key={section.href}>
              <AdminNavLink
                href={section.href}
                label={section.label}
                exact={section.exact}
                currentPath={currentPath}
              />
            </li>
          ))}
          <li className="hidden md:mt-8 md:block">
            <AdminNavLink
              href={appRoutes.adminSignOut.path}
              label={appRoutes.adminSignOut.label}
              exact
              currentPath={currentPath}
            />
          </li>
        </ul>
      </nav>
      {/* Bottom padding keeps the last content above the fixed phone navigation. */}
      <div className="min-w-0 flex-1 pb-28 md:pb-0">{children}</div>
    </div>
  );
}
