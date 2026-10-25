import type { InputHTMLAttributes } from "react";

import { cn } from "../../lib/cn";
import { FieldMessages, useFieldIds, type FieldMessageProps } from "./field";

export interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type">, FieldMessageProps {
  label: string;
}

/** Native checkbox; the whole label row is the 44px tap target. */
export function Checkbox({ label, hint, error, id, className, ...props }: CheckboxProps) {
  const ids = useFieldIds({ id, hint, error });
  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={ids.controlId}
        className="flex min-h-11 cursor-pointer items-center gap-3 text-base text-foreground has-disabled:cursor-not-allowed has-disabled:opacity-60"
      >
        <input
          id={ids.controlId}
          type="checkbox"
          aria-invalid={ids.invalid || undefined}
          aria-describedby={ids.describedBy}
          className={cn(
            "size-5 shrink-0 cursor-pointer rounded-sm accent-primary",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
            className,
          )}
          {...props}
        />
        {label}
      </label>
      <FieldMessages hint={hint} error={error} ids={ids} className="pl-8" />
    </div>
  );
}
