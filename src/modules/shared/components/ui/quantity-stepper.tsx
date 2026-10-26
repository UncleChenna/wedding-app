"use client";

import { useRef, useState, type KeyboardEvent } from "react";

import { cn } from "../../lib/cn";
import { controlClasses, FieldMessages, useFieldIds, type FieldMessageProps } from "./field";

export interface QuantityStepperProps extends FieldMessageProps {
  label: string;
  id?: string;
  name?: string;
  min?: number;
  max?: number;
  step?: number;
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  disabled?: boolean;
  className?: string;
  required?: boolean;
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

const stepButton =
  "inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-md border border-input bg-surface text-foreground hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50";

/**
 * Number input with − and + buttons. Arrow keys step, Home/End jump to the bounds, and a
 * typed value is clamped to [min, max] when the field loses focus.
 */
export function QuantityStepper({
  label,
  id,
  name,
  min = 0,
  max = 99,
  step = 1,
  value,
  defaultValue,
  onValueChange,
  disabled,
  className,
  required,
  hint,
  error,
}: QuantityStepperProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const ids = useFieldIds({ id, hint, error });
  const [internal, setInternal] = useState(clamp(defaultValue ?? min, min, max));
  const current = value ?? internal;
  // While typing, keep the raw text so the field can be cleared and retyped.
  const [draft, setDraft] = useState<string | null>(null);

  const commit = (next: number) => {
    const clamped = clamp(Number.isFinite(next) ? next : min, min, max);
    setDraft(null);
    if (value === undefined) setInternal(clamped);
    if (clamped !== current) onValueChange?.(clamped);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    const parsed = draft === null ? current : Number(draft);
    const base = clamp(Number.isFinite(parsed) ? parsed : min, min, max);
    const moves: Record<string, number> = {
      ArrowUp: base + step,
      ArrowDown: base - step,
      Home: min,
      End: max,
    };
    const next = moves[event.key];
    if (next === undefined) return;
    event.preventDefault();
    commit(next);
  };

  const stepFromButton = (delta: number) => {
    const next = clamp(current + delta, min, max);
    // A newly disabled button cannot retain keyboard focus reliably across browsers.
    if (next === min || next === max) inputRef.current?.focus();
    commit(next);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={ids.controlId} className="text-sm font-medium text-foreground">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          aria-controls={ids.controlId}
          disabled={disabled || current <= min}
          onClick={() => stepFromButton(-step)}
          className={stepButton}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="size-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M6 12h12" strokeLinecap="round" />
          </svg>
        </button>
        <input
          ref={inputRef}
          required={required}
          id={ids.controlId}
          name={name}
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          value={draft ?? current}
          aria-invalid={ids.invalid || undefined}
          aria-describedby={ids.describedBy}
          onChange={(event) => setDraft(event.currentTarget.value)}
          onBlur={() => draft !== null && commit(Number(draft))}
          onKeyDown={onKeyDown}
          className={cn(
            controlClasses,
            "min-h-11 w-20 [appearance:textfield] text-center tabular-nums [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
            error && "border-danger",
            className,
          )}
        />
        <button
          type="button"
          aria-label={`Increase ${label}`}
          aria-controls={ids.controlId}
          disabled={disabled || current >= max}
          onClick={() => stepFromButton(step)}
          className={stepButton}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="size-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M12 6v12M6 12h12" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      <FieldMessages hint={hint} error={error} ids={ids} />
    </div>
  );
}
