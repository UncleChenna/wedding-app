import Link from "next/link";
import { appRoutes } from "../lib/routes";
import { CenteredPanel, panelLinkClassName } from "./ui/centered-panel";

const stationLink =
  "flex min-h-14 w-full items-center justify-center rounded-md border border-border bg-background px-4 text-lg font-medium text-foreground hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

export function StaffHub() {
  return (
    <CenteredPanel
      variant="staff"
      eyebrow="Staff"
      title="Choose your station"
      description="Welcome, team. Open your station to get ready for the celebration."
      footer={
        <>
          <Link href={appRoutes.gateRecovery.path} className={panelLinkClassName}>
            Recover retained gate records
          </Link>
          <Link href={appRoutes.home.path} className={panelLinkClassName}>
            Back to our day
          </Link>
        </>
      }
    >
      <nav aria-label="Staff stations">
        <ul className="flex flex-col gap-3">
          {[appRoutes.checkin, appRoutes.kitchen, appRoutes.bar, appRoutes.host].map((route) => (
            <li key={route.path}>
              <Link href={route.path} className={stationLink}>
                {route.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </CenteredPanel>
  );
}
