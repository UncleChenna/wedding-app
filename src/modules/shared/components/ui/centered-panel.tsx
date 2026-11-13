import type { ReactNode } from "react";

import { cn } from "../../lib/cn";
import { Divider } from "./decorations";

export interface CenteredPanelProps {
  /** Small uppercase label above the title, e.g. "Wedding admin". */
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  /** The page's form or actions; fields stay full width inside the panel. */
  children?: ReactNode;
  /** Quiet links under the panel's content, such as "Back to our day". */
  footer?: ReactNode;
  /** `guest` uses the ornamented divider; `staff` (staff and admin screens) a plain hairline. */
  variant?: "guest" | "staff";
  className?: string;
}

/**
 * One focused task or message, centred in the remaining height and width (sign-in, PIN entry, lost link,
 * not found). On wider screens it sits on a bordered surface; on phones it runs edge to edge.
 */
export function CenteredPanel({
  eyebrow,
  title,
  description,
  children,
  footer,
  variant = "guest",
  className,
}: CenteredPanelProps) {
  return (
    <main
      className={cn(
        "flex w-full flex-1 flex-col items-center justify-center px-6 py-10 pb-[max(2.5rem,env(safe-area-inset-bottom))] sm:py-10",
        className,
      )}
    >
      <div
        data-centered-panel
        className="w-full max-w-md sm:rounded-lg sm:border sm:border-border sm:bg-surface sm:px-10 sm:py-10"
      >
        <header className="flex flex-col items-center text-center">
          {eyebrow ? (
            <p
              className={cn(
                "font-medium tracking-[0.12em] text-primary uppercase",
                // Staff screens keep every line at 18px or more for arm's-length reading.
                variant === "staff" ? "text-lg" : "text-sm",
              )}
            >
              {eyebrow}
            </p>
          ) : null}
          <h1
            className={cn(
              "font-display text-4xl leading-tight text-balance sm:text-5xl",
              eyebrow ? "mt-4" : "",
            )}
          >
            {title}
          </h1>
          <Divider variant={variant} className="mt-6 max-w-40" />
          {description ? (
            <div className="mt-6 text-lg leading-relaxed text-pretty text-muted-foreground">
              {description}
            </div>
          ) : null}
        </header>
        {children ? <div className="mt-8">{children}</div> : null}
        {footer ? (
          <div className="mt-8 flex flex-col items-center gap-1 text-center">{footer}</div>
        ) : null}
      </div>
    </main>
  );
}

/** Underlined text link sized for touch, for a CenteredPanel footer. */
export const panelLinkClassName =
  "inline-flex min-h-11 items-center text-lg text-primary underline underline-offset-4";
