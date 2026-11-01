import Link from "next/link";
import type { Route } from "next";
import { appRoutes } from "../lib/routes";
import type { ReactNode } from "react";

export interface PagePlaceholderProps {
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
  backTo?: { path: Route; label: string };
}

/** Temporary page body for routes whose feature has not been built yet. */
export function PagePlaceholder({
  eyebrow,
  title,
  description,
  children,
  backTo,
}: PagePlaceholderProps) {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-6 px-6 py-16 text-center">
      <p className="text-lg font-semibold tracking-widest text-primary uppercase">{eyebrow}</p>
      <h1 className="font-display text-4xl leading-tight font-medium text-balance sm:text-5xl">
        {title}
      </h1>
      <p className="max-w-md text-lg leading-relaxed text-pretty text-muted-foreground">
        {description}
      </p>
      {children}
      <Link
        href={backTo?.path ?? appRoutes.home.path}
        className="mt-6 inline-flex min-h-11 items-center text-lg text-primary underline underline-offset-4"
      >
        {backTo?.label ?? "Back to our day"}
      </Link>
    </main>
  );
}
