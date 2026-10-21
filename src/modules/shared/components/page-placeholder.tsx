import type { ReactNode } from "react";

export interface PagePlaceholderProps {
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
}

/** Temporary page body for routes whose feature has not been built yet. */
export function PagePlaceholder({ eyebrow, title, description, children }: PagePlaceholderProps) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col items-center justify-center gap-5 px-6 py-16 text-center">
      <p className="text-xs font-semibold tracking-[0.3em] text-primary uppercase">{eyebrow}</p>
      <h1 className="font-display text-4xl leading-tight font-medium text-balance sm:text-5xl">
        {title}
      </h1>
      <p className="max-w-md text-base text-pretty text-muted-foreground">{description}</p>
      {children}
    </main>
  );
}
