import { appRoutes } from "@/modules/shared/lib/routes";
import type { Metadata } from "next";
import Link from "next/link";
export const metadata: Metadata = { title: "Page previews", robots: { index: false } };
const pages = [
  [appRoutes.home.path, "Wedding home"],
  [appRoutes.invite.path, "Invitation guidance"],
  [appRoutes.devInvitation.path, "Invitation preview"],
  [appRoutes.devLetter.path, "Personal invitation layout"],
  [appRoutes.devRsvp.path, "RSVP preview"],
  [appRoutes.devOrder.path, "Table ordering preview"],
  [appRoutes.devShare.path, "Invitation sharing preview"],
  [appRoutes.devPass.path, "Gate pass preview"],
  [appRoutes.devTheme.path, "Components and themes"],
] as const;
export default function PreviewIndex() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <p className="mb-6 text-base tracking-widest text-primary uppercase">Work in progress</p>
      <h1 className="font-display text-5xl tracking-tight md:text-6xl">
        See the celebration take shape
      </h1>
      <p className="mt-8 text-lg leading-relaxed">
        Browse the pages built so far. Previews use sample details and do not submit responses or
        orders.
      </p>
      <nav aria-label="Available pages" className="my-12">
        <ul className="space-y-6">
          {pages.map(([href, label]) => (
            <li key={href}>
              <Link
                href={href}
                className="inline-flex min-h-11 items-center text-lg text-primary underline underline-offset-4"
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <h2 className="font-display text-3xl">Coming next</h2>
      <ol className="mt-6 list-inside list-decimal space-y-4 text-base leading-relaxed">
        <li>Gate check-in and kitchen screens</li>
        <li>Guest management and seating</li>
      </ol>
      <p className="mt-8 text-base leading-relaxed">
        Personal invitations and saved replies are available through your invitation link. Gate
        scanning, table orders and staff sign-in are still being built.
      </p>
    </main>
  );
}
