"use client";

import { useEffect } from "react";

import { logger } from "@/modules/shared/lib/logger";
import { getActiveThemes } from "@/modules/theming";
import { ThemeStyles } from "@/modules/theming/components/theme-styles";

import "./globals.css";

const themes = getActiveThemes();

/** Replaces the root layout when it throws, so it renders its own <html> with the theme. */
export default function GlobalError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    logger.error("unhandled root error", { error });
  }, [error]);

  return (
    <html lang="en">
      <head>
        <ThemeStyles themes={themes} />
      </head>
      <body className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background px-6 text-center font-sans text-foreground">
        <title>Something went wrong</title>
        <h1 className="text-3xl font-medium">Something went wrong</h1>
        <p className="text-muted-foreground">Please refresh the page or try again shortly.</p>
        <button
          type="button"
          onClick={() => retry()}
          className="min-h-11 cursor-pointer rounded-md bg-primary px-5 text-primary-foreground"
        >
          Try again
        </button>
      </body>
    </html>
  );
}
