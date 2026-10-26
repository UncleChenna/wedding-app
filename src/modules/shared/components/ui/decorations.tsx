import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "../../lib/cn";

/**
 * Theme-driven decoration (design principles §5): hairlines, monogram and paper texture
 * come from theme tokens, never one-off styles. Use sparingly: one divider between major
 * sections, one monogram per page at most.
 */

export interface DividerProps {
  /** `guest` adds a small ornament; `staff` is a plain, lighter hairline. */
  variant?: "guest" | "staff";
  className?: string;
}

export function Divider({ variant = "guest", className }: DividerProps) {
  if (variant === "staff") {
    return (
      <hr
        data-variant="staff"
        className={cn("w-full border-0 border-t border-border opacity-70", className)}
      />
    );
  }
  return (
    <div
      role="separator"
      data-variant="guest"
      className={cn("flex w-full items-center gap-4 text-border", className)}
    >
      <span className="h-px flex-1 bg-current" />
      <svg data-ornament aria-hidden="true" viewBox="0 0 12 12" className="size-2.5 text-primary">
        <path
          d="M6 0.8 L11.2 6 L6 11.2 L0.8 6 Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
        />
      </svg>
      <span className="h-px flex-1 bg-current" />
    </div>
  );
}

export interface MonogramProps {
  /** The couple's initials, e.g. ["A", "G"]; later read from event settings (TICKET-025). */
  initials: readonly [string, string];
  /** Hide from assistive technology when the names are already on the page. */
  decorative?: boolean;
  className?: string;
}

export function Monogram({ initials, decorative = false, className }: MonogramProps) {
  const [a, b] = initials;
  return (
    <div
      {...(decorative
        ? { "aria-hidden": true }
        : { role: "img", "aria-label": `${a} & ${b} monogram` })}
      className={cn(
        "inline-flex size-24 items-center justify-center rounded-full border border-primary text-primary",
        className,
      )}
    >
      <span data-initials className="font-display text-4xl leading-none">
        {a}
        <span className="mx-0.5 align-middle text-2xl">&amp;</span>
        {b}
      </span>
    </div>
  );
}

export interface PaperProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}

/**
 * A panel with the theme's paper texture behind its content (the same mask and strength
 * as the page texture). Plain when the theme has no pattern.
 */
export function Paper({ children, className, ...props }: PaperProps) {
  return (
    <div className={cn("relative isolate overflow-hidden", className)} {...props}>
      <div aria-hidden="true" data-paper-texture className="paper-texture" />
      {children}
    </div>
  );
}
