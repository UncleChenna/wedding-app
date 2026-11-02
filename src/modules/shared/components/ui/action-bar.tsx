import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "../../lib/cn";

export interface ActionBarProps extends HTMLAttributes<HTMLDivElement> {
  /** One short sentence about the current state, e.g. "2 menu items selected." Announced politely. */
  status?: ReactNode;
  /**
   * Keep the actions in thumb reach at the bottom of a phone screen while a long step scrolls
   * beneath (design principles §6). From `md` up it is an ordinary row. Bleeds into a `px-6` gutter.
   */
  sticky?: boolean;
}

/** A step's main actions, with an optional status line above them. */
export function ActionBar({
  status,
  sticky = true,
  className,
  children,
  ...props
}: ActionBarProps) {
  return (
    <div
      data-action-bar={sticky ? "sticky" : ""}
      className={cn(
        "flex flex-col gap-3",
        sticky &&
          "sticky bottom-0 z-10 -mx-6 border-t border-border bg-background px-6 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:static md:mx-0 md:border-0 md:bg-transparent md:p-0",
        className,
      )}
      {...props}
    >
      {status && (
        <p aria-live="polite" className="leading-relaxed">
          {status}
        </p>
      )}
      <div className="flex flex-wrap gap-4">{children}</div>
    </div>
  );
}
