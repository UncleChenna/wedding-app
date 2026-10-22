import type { SelectHTMLAttributes } from "react";

import { cn } from "../../lib/cn";
import { controlClasses, FieldMessages, useFieldIds, type FieldMessageProps } from "./field";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement>, FieldMessageProps {
  label: string;
}

/** Native <select>: the platform picker is the most usable option on phones. */
export function Select({ label, hint, error, id, className, children, ...props }: SelectProps) {
  const ids = useFieldIds({ id, hint, error });
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={ids.controlId} className="text-sm font-medium text-foreground">
        {label}
      </label>
      <div className="relative">
        <select
          id={ids.controlId}
          aria-invalid={ids.invalid || undefined}
          aria-describedby={ids.describedBy}
          className={cn(
            controlClasses,
            "min-h-11 w-full cursor-pointer appearance-none pr-10",
            error && "border-danger",
            className,
          )}
          {...props}
        >
          {children}
        </select>
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="pointer-events-none absolute top-1/2 right-3.5 size-5 -translate-y-1/2 text-muted-foreground"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <FieldMessages hint={hint} error={error} ids={ids} />
    </div>
  );
}
