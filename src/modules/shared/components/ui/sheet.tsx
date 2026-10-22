"use client";

import { useEffect, useId, useRef, type KeyboardEvent, type ReactNode } from "react";

import { cn } from "../../lib/cn";

export interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Keep Tab inside the dialog. A modal <dialog> makes the page behind it inert,
 * but Tab past the last control still escapes to the browser UI.
 */
function trapTab(event: KeyboardEvent<HTMLDialogElement>) {
  if (event.key !== "Tab") return;
  const focusable = [...event.currentTarget.querySelectorAll<HTMLElement>(FOCUSABLE)];
  const first = focusable[0];
  const last = focusable.at(-1);
  if (!first || !last) return;
  const active = document.activeElement;
  if (event.shiftKey && (active === first || !event.currentTarget.contains(active))) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && active === last) {
    event.preventDefault();
    first.focus();
  }
}

/**
 * A modal panel built on the native <dialog> element (Escape, inert background
 * and focus return for free; Tab is trapped explicitly). Slides up from the
 * bottom on phones and sits centred on larger screens.
 */
export function Sheet({ open, onOpenChange, title, description, children, className }: SheetProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onClose={() => onOpenChange(false)}
      onKeyDown={trapTab}
      onClick={(event) => {
        // A click on the dialog element itself (not its content) is a backdrop click.
        if (event.target === event.currentTarget) onOpenChange(false);
      }}
      className={cn(
        "m-0 mt-auto w-full max-w-none rounded-t-lg border border-border bg-surface p-0 text-foreground shadow-lg",
        "backdrop:bg-foreground/40 backdrop:backdrop-blur-[2px]",
        "sm:m-auto sm:max-w-lg sm:rounded-lg",
        className,
      )}
    >
      <div className="flex flex-col gap-4 p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <div
          aria-hidden="true"
          className="mx-auto -mt-2 h-1.5 w-12 rounded-full bg-border sm:hidden"
        />
        <header className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h2 id={titleId} className="font-display text-2xl leading-tight font-medium">
              {title}
            </h2>
            {description && (
              <p id={descriptionId} className="text-sm text-muted-foreground">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Close"
            className="-m-2 inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground hover:bg-surface-muted hover:text-foreground"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="size-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </header>
        {children}
      </div>
    </dialog>
  );
}
