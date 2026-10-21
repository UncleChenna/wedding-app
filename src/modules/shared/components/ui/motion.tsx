import type { HTMLAttributes } from "react";

import { cn } from "../../lib/cn";

export interface MotionProps extends HTMLAttributes<HTMLDivElement> {
  pace?: "enter" | "signature";
}

/** CSS-only entrance: content is server-rendered and actions never await animation. */
export function FadeIn({ pace = "enter", className, ...props }: MotionProps) {
  return (
    <div
      {...props}
      className={cn("motion-fade-in", pace === "signature" && "motion-signature", className)}
    />
  );
}

export function Rise({ pace = "enter", className, ...props }: MotionProps) {
  return (
    <div
      {...props}
      className={cn("motion-rise", pace === "signature" && "motion-signature", className)}
    />
  );
}
