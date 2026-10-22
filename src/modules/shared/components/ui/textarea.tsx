import type { TextareaHTMLAttributes } from "react";

import { cn } from "../../lib/cn";
import { controlClasses, FieldMessages, useFieldIds, type FieldMessageProps } from "./field";

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement>, FieldMessageProps {
  label: string;
}

export function Textarea({ label, hint, error, id, className, rows = 4, ...props }: TextareaProps) {
  const ids = useFieldIds({ id, hint, error });
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={ids.controlId} className="text-sm font-medium text-foreground">
        {label}
      </label>
      <textarea
        id={ids.controlId}
        rows={rows}
        aria-invalid={ids.invalid || undefined}
        aria-describedby={ids.describedBy}
        className={cn(
          controlClasses,
          "min-h-28 w-full py-3 leading-relaxed",
          error && "border-danger",
          className,
        )}
        {...props}
      />
      <FieldMessages hint={hint} error={error} ids={ids} />
    </div>
  );
}
