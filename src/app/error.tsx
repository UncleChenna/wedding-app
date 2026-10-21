"use client";

import { useEffect } from "react";

import { Button } from "@/modules/shared/components/ui";
import { logger } from "@/modules/shared/lib/logger";

export default function ErrorPage({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    logger.error("unhandled route error", { error });
  }, [error]);

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="font-display text-3xl font-medium">Something went wrong</h1>
      <p className="text-muted-foreground">
        Sorry, this page hit a problem. Please try again in a moment.
      </p>
      <Button onClick={() => retry()}>Try again</Button>
    </main>
  );
}
