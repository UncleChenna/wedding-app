import type { InputHTMLAttributes } from "react";

import { cn } from "../../lib/cn";
import { controlClasses, FieldMessages, useFieldIds } from "./field";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
}

export function Input({ label, hint, error, id, className, ...props }: InputProps) {
  const ids = useFieldIds({ id, hint, error });

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={ids.controlId} className="text-sm font-medium text-foreground">
        {label}
      </label>
      <input
        id={ids.controlId}
        aria-invalid={ids.invalid || undefined}
        aria-describedby={ids.describedBy}
        className={cn(controlClasses, "min-h-11 w-full", error && "border-danger", className)}
        {...props}
      />
      <FieldMessages hint={hint} error={error} ids={ids} />
    </div>
  );
}
