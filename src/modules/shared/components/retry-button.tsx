"use client";

import { Button } from "./ui";

/** Reloads the page the guest was trying to open; the worker serves it if the signal is back. */
export function RetryButton() {
  return (
    <Button size="lg" fullWidth className="sm:w-auto" onClick={() => window.location.reload()}>
      Try again
    </Button>
  );
}
