"use client";

import { useState } from "react";

import { Button, FadeIn, Rise } from "@/modules/shared/components/ui";

/** Demo-only state; the primitives themselves need no client JavaScript. */
export function MotionShowcase() {
  const [replay, setReplay] = useState(0);
  return (
    <div data-testid="motion-showcase" data-replay={replay} className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex max-w-prose flex-col gap-2">
          <h3 className="font-display text-3xl">A gentle welcome</h3>
          <p className="text-base leading-relaxed text-muted-foreground">
            A soft fade or rise. With reduced motion, everything appears immediately.
          </p>
        </div>
        <Button className="motion-control" onClick={() => setReplay((value) => value + 1)}>
          Replay motion
        </Button>
      </div>
      <div key={replay} className="grid gap-6 sm:grid-cols-3">
        <FadeIn data-testid="motion-fade" className="rounded-md bg-surface p-6">
          <p className="font-display text-2xl">Fade in</p>
          <p className="mt-2 text-base leading-relaxed text-muted-foreground">A quiet arrival.</p>
        </FadeIn>
        <Rise data-testid="motion-rise" className="rounded-md bg-surface p-6">
          <p className="font-display text-2xl">Gentle rise</p>
          <p className="mt-2 text-base leading-relaxed text-muted-foreground">A little lift.</p>
        </Rise>
        <FadeIn
          pace="signature"
          data-testid="motion-signature"
          className="rounded-md bg-surface p-6"
        >
          <p className="font-display text-2xl">Take a moment</p>
          <p className="mt-2 text-base leading-relaxed text-muted-foreground">
            Room for the occasion.
          </p>
        </FadeIn>
      </div>
    </div>
  );
}
