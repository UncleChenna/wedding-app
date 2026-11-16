import { appRoutes } from "@/modules/shared/lib/routes";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PrintedInvitationCard } from "@/modules/invitations/components/printed-invitation-card";
import { listThemes, themeStyle } from "@/modules/theming";

export const metadata: Metadata = { title: "Invitation preview", robots: { index: false } };

async function ThemedInvitation({ searchParams }: { searchParams: Promise<{ theme?: string }> }) {
  const { theme: selected } = await searchParams;
  const themes = listThemes();
  // No ?theme follows the device light/dark setting, like the real site.
  const theme = themes.find((item) => item.id === selected);
  const links = [{ id: "", name: "Match my device" }, ...themes];
  return (
    <div style={theme && themeStyle(theme)} className="min-h-dvh bg-background text-foreground">
      <nav
        aria-label="Preview theme"
        className="mx-auto flex max-w-7xl flex-wrap gap-6 px-6 pt-6 md:px-12"
      >
        {links.map((item) => (
          <Link
            key={item.id}
            href={
              item.id
                ? `${appRoutes.devInvitation.path}?theme=${item.id}`
                : appRoutes.devInvitation.path
            }
            aria-current={(theme?.id ?? "") === item.id ? "page" : undefined}
            className="inline-flex min-h-11 items-center text-primary underline underline-offset-4"
          >
            {item.name}
          </Link>
        ))}
      </nav>
      <main className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="type-heading">Your invitation card</h1>
        <p className="my-6 text-lg leading-relaxed">
          Original card preview · sample guest and card number. No invitation is sent here.
        </p>
        <PrintedInvitationCard
          card={{ cardNumber: 3, guestName: "Sample guest", capacity: 2 }}
          replyHref="#preview-reply"
        />
        <a
          href="/dev/invitation/card.pdf"
          className="mt-6 inline-flex min-h-11 items-center text-primary underline"
        >
          Download sample card
        </a>
        <section id="preview-reply" className="mt-12 scroll-mt-6">
          <h2 className="type-heading">Your online RSVP</h2>
          <p className="mt-6 text-lg leading-relaxed">
            Your guest’s personal link will show their card number and let them reply online. This
            sample does not save a reply.
          </p>
          <Link
            href={appRoutes.devRsvp.path}
            className="mt-6 inline-flex min-h-11 items-center text-primary underline"
          >
            Try RSVP preview
          </Link>
        </section>
      </main>
    </div>
  );
}

export default function InvitationPreview(props: { searchParams: Promise<{ theme?: string }> }) {
  return (
    <Suspense fallback={<main className="p-6 text-lg">Preparing the invitation preview…</main>}>
      <ThemedInvitation {...props} />
    </Suspense>
  );
}
