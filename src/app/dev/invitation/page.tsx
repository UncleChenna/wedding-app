import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { InvitationView } from "@/modules/invitations/components/invitation-view";
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
            href={item.id ? `/dev/invitation?theme=${item.id}` : "/dev/invitation"}
            aria-current={(theme?.id ?? "") === item.id ? "page" : undefined}
            className="inline-flex min-h-11 items-center text-primary underline underline-offset-4"
          >
            {item.name}
          </Link>
        ))}
      </nav>
      <InvitationView
        details={{
          names: ["Uchenna", "Adaora"],
          date: "Saturday, 19 December 2026",
          time: "Time to follow",
          venue: "Sample Garden",
          address: "London — sample location",
          dressCode: "Sample: formal attire",
        }}
      />
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
