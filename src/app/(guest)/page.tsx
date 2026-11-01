import { appRoutes } from "@/modules/shared/lib/routes";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Uchenna & Adaora",
  description: "Celebrate with us on Saturday, 19 December 2026.",
  openGraph: {
    title: "Uchenna & Adaora",
    description: "Celebrate with us on Saturday, 19 December 2026.",
  },
};

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col items-center justify-center px-6 py-16 text-center">
      <p className="mb-12 text-base tracking-widest text-primary uppercase">The celebration</p>
      <h1 className="font-display text-6xl leading-tight tracking-tight md:text-8xl">
        Uchenna <span className="block text-primary">&amp;</span> Adaora
      </h1>
      <p className="mt-10 font-display text-3xl md:text-4xl">Two stories. One ending: forever.</p>
      <p className="mt-8 text-lg leading-relaxed">Saturday, 19 December 2026</p>
      <p className="mt-4 max-w-prose text-base leading-relaxed">
        We can&apos;t wait to celebrate with you.
        <br />
        Venue and time details will follow.
      </p>
      <Link
        prefetch={false}
        href={appRoutes.invite.path}
        className="mt-10 inline-flex min-h-11 items-center text-lg text-primary underline underline-offset-4"
      >
        Your invitation
      </Link>
      {process.env.NODE_ENV === "development" && (
        <Link
          prefetch={false}
          href={appRoutes.dev.path}
          className="mt-8 inline-flex min-h-11 items-center text-primary underline underline-offset-4"
        >
          Browse page previews
        </Link>
      )}
    </main>
  );
}
