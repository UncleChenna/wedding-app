import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Your invitation",
  description: "A personal invitation to celebrate Uchenna and Adaora.",
  openGraph: {
    title: "Your invitation",
    description: "A personal invitation to celebrate Uchenna and Adaora.",
  },
};

export default function InvitationGuidePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col justify-center px-6 py-16">
      <p className="mb-8 text-base tracking-widest text-primary uppercase">Uchenna &amp; Adaora</p>
      <h1 className="font-display text-5xl tracking-tight md:text-6xl">
        An invitation just for you
      </h1>
      <p className="mt-8 text-lg leading-relaxed">
        Your personal invitation will arrive as a link from us. Keep it close — it will be your way
        to reply and find the details for our celebration.
      </p>
      <p className="mt-6 text-base leading-relaxed">
        For now, save the date: Saturday, 19 December 2026. If you need a hand, get in touch with
        Uchenna or Adaora.
      </p>
      <Link
        href="/"
        className="mt-10 inline-flex min-h-11 items-center self-start text-primary underline underline-offset-4"
      >
        Back to our day
      </Link>
    </main>
  );
}
