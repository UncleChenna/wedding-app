import Link from "next/link";
import { appRoutes } from "../lib/routes";

export function StaffHub() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12 text-lg leading-relaxed">
      <h1 className="font-display text-4xl leading-tight md:text-5xl">Choose your station</h1>
      <p className="mt-6 max-w-prose">
        Welcome, team. Open your station to get ready for the celebration.
      </p>
      <nav aria-label="Staff stations" className="mt-12">
        <ul className="space-y-8">
          {[appRoutes.checkin, appRoutes.kitchen, appRoutes.bar].map((route) => (
            <li key={route.path}>
              <Link
                href={route.path}
                className="inline-flex min-h-11 items-center py-2 text-primary underline underline-offset-4"
              >
                {route.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <Link
        href={appRoutes.home.path}
        className="mt-12 inline-flex min-h-11 items-center text-primary underline underline-offset-4"
      >
        Back to our day
      </Link>
    </main>
  );
}
