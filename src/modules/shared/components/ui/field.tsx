import { useId, type ReactNode } from "react";

import { cn } from "../../lib/cn";

export interface FieldMessageProps {
  /** Help text shown under the control. */
  hint?: string;
  /** Error shown under the control; sets aria-invalid and is announced politely. */
  error?: string;
}

export interface FieldIds {
  controlId: string;
  hintId?: string;
  errorId: string;
  /** Space-separated ids for aria-describedby, or undefined when there is nothing to describe. */
  describedBy?: string;
  invalid: boolean;
}

/** Stable ids that tie a control to its label, hint and error. */
export function useFieldIds({ id, hint, error }: FieldMessageProps & { id?: string }): FieldIds {
  const generated = useId();
  const controlId = id ?? generated;
  const hintId = hint ? `${controlId}-hint` : undefined;
  const errorId = `${controlId}-error`;
  const describedBy = [hintId, error ? errorId : undefined].filter(Boolean).join(" ") || undefined;
  return { controlId, hintId, errorId, describedBy, invalid: Boolean(error) };
}

/**
 * Hint and error text. The error lives in an always-present polite live region so it is
 * announced when it appears, not only when the control is focused.
 */
export function FieldMessages({
  hint,
  error,
  ids,
  className,
}: FieldMessageProps & { ids: FieldIds; className?: string }) {
  return (
    <>
      {hint && (
        <p id={ids.hintId} className={cn("text-sm text-muted-foreground", className)}>
          {hint}
        </p>
      )}
      <div aria-live="polite" className={cn("empty:hidden", className)}>
        {error && (
          <p id={ids.errorId} className="text-sm font-medium text-danger">
            {error}
          </p>
        )}
      </div>
    </>
  );
}

export interface FieldProps extends FieldMessageProps {
  label: string;
  id?: string;
  /** Render the control with the ids and attributes it must carry. */
  children: (control: {
    id: string;
    "aria-describedby"?: string;
    "aria-invalid"?: true;
  }) => ReactNode;
}

/** Label + control + hint + error for custom controls. Built-in controls use the same parts. */
export function Field({ label, hint, error, id, children }: FieldProps) {
  const ids = useFieldIds({ id, hint, error });
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={ids.controlId} className="text-sm font-medium text-foreground">
        {label}
      </label>
      {children({
        id: ids.controlId,
        "aria-describedby": ids.describedBy,
        "aria-invalid": ids.invalid ? true : undefined,
      })}
      <FieldMessages hint={hint} error={error} ids={ids} />
    </div>
  );
}

/** Shared look for text-like controls (input, textarea, select). */
export const controlClasses = cn(
  "w-full rounded-md border border-input bg-surface px-3.5 text-base text-foreground",
  "placeholder:text-muted-foreground",
  "transition-shadow focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring",
  "disabled:cursor-not-allowed disabled:bg-surface-muted disabled:opacity-60",
);
