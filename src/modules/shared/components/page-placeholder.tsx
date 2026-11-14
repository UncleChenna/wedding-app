import Link from "next/link";
import type { Route } from "next";
import { appRoutes } from "../lib/routes";
import type { ReactNode } from "react";
import { CenteredPanel, panelLinkClassName } from "./ui/centered-panel";

export interface PagePlaceholderProps {
  eyebrow: string;
  title: ReactNode;
  description: ReactNode;
  children?: ReactNode;
  /** `null` hides the back link when the page supplies its own way out. */
  backTo?: { path: Route; label: string } | null;
  className?: string;
  /** `staff` for staff screens: a plain divider instead of the guest ornament. */
  variant?: "guest" | "staff";
}

/** A centred single-message page (staff station sign-in, not found), built on CenteredPanel. */
export function PagePlaceholder({
  eyebrow,
  title,
  description,
  children,
  backTo,
  className,
  variant = "guest",
}: PagePlaceholderProps) {
  return (
    <CenteredPanel
      eyebrow={eyebrow}
      title={title}
      description={description}
      variant={variant}
      className={className}
      footer={
        backTo === null ? undefined : (
          <Link href={backTo?.path ?? appRoutes.home.path} className={panelLinkClassName}>
            {backTo?.label ?? "Back to our day"}
          </Link>
        )
      }
    >
      {children ? <div className="flex flex-col items-center gap-4">{children}</div> : null}
    </CenteredPanel>
  );
}
