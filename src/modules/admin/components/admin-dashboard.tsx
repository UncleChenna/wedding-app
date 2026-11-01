import { appRoutes } from "@/modules/shared/lib/routes";
import Link from "next/link";
import { requireAdminPageAccess } from "../server/current-admin-access";

export async function AdminDashboard() {
  await requireAdminPageAccess();
  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-12 text-lg leading-relaxed">
      <h1 className="font-display text-4xl leading-tight md:text-5xl">Wedding control room</h1>
      <p className="mt-6 max-w-prose">Everything for your celebration, in one place.</p>
      <ul className="mt-12 grid gap-8 sm:grid-cols-2">
        {["Guests", "Seating", "Menu", "Staff", "Settings", "Live dashboard"].map((name) => (
          <li key={name}>
            <h2 className="font-display text-3xl">{name}</h2>
            <p className="mt-3 text-muted-foreground">Coming soon</p>
          </li>
        ))}
        <li>
          <Link
            href={appRoutes.adminSharing.path}
            className="inline-flex min-h-11 items-center text-primary underline underline-offset-4"
          >
            Sharing
          </Link>
          <p className="mt-3">Send a personal invitation or copy its link.</p>
        </li>
      </ul>
      <nav aria-label="Admin account" className="mt-12 flex flex-wrap gap-8">
        <Link
          href={appRoutes.home.path}
          className="inline-flex min-h-11 items-center text-primary underline underline-offset-4"
        >
          Back to our day
        </Link>
        <Link
          href={appRoutes.adminSignOut.path}
          className="inline-flex min-h-11 items-center text-primary underline underline-offset-4"
        >
          Sign out
        </Link>
      </nav>
    </main>
  );
}
