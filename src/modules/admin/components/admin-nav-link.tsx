"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/modules/shared/lib/cn";

/** A shell link that marks itself as the current page, the only part of the shell that needs the browser. */
export function AdminNavLink({
  href,
  label,
  exact = false,
  currentPath,
}: {
  href: string;
  label: string;
  exact?: boolean;
  /** Overrides the browser path, for the `/dev/admin` preview. */
  currentPath?: string;
}) {
  const browserPath = usePathname();
  const pathname = currentPath ?? browserPath;
  const current = exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");
  return (
    <Link
      href={href}
      aria-current={current ? "page" : undefined}
      className={cn(
        "inline-flex min-h-11 w-full items-center justify-center rounded-md px-3 py-2 text-base leading-tight focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring md:justify-start",
        current
          ? "bg-surface-muted font-medium text-foreground"
          : "text-primary underline-offset-4 hover:underline",
      )}
    >
      {label}
    </Link>
  );
}
