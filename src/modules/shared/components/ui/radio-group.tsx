import { useId } from "react";

import { FieldMessages, useFieldIds, type FieldMessageProps } from "./field";

export interface RadioOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface RadioGroupProps extends FieldMessageProps {
  name: string;
  legend: string;
  options: readonly RadioOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
}

/**
 * Native radios in a fieldset. The invalid state and description sit on the radiogroup:
 * ARIA allows aria-invalid there, not on individual radios.
 */
export function RadioGroup({
  name,
  legend,
  options,
  value,
  defaultValue,
  onValueChange,
  required,
  disabled,
  hint,
  error,
}: RadioGroupProps) {
  const ids = useFieldIds({ hint, error });
  const legendId = useId();
  return (
    <fieldset
      role="radiogroup"
      aria-labelledby={legendId}
      aria-invalid={ids.invalid || undefined}
      aria-describedby={ids.describedBy}
      aria-required={required || undefined}
      disabled={disabled}
      className="flex flex-col gap-1"
    >
      <legend id={legendId} className="mb-1 text-sm font-medium text-foreground">
        {legend}
      </legend>
      {options.map((option) => (
        <label
          key={option.value}
          className="flex min-h-11 cursor-pointer items-center gap-3 text-base text-foreground has-disabled:cursor-not-allowed has-disabled:opacity-60"
        >
          <input
            type="radio"
            name={name}
            value={option.value}
            required={required}
            disabled={option.disabled}
            {...(value !== undefined
              ? { checked: value === option.value }
              : { defaultChecked: defaultValue === option.value })}
            // Only attach a handler when one is given, so an uncontrolled group can render from
            // a Server Component (event handlers cannot cross the server boundary).
            onChange={
              onValueChange ? (event) => onValueChange(event.currentTarget.value) : undefined
            }
            className="size-5 shrink-0 cursor-pointer accent-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          />
          {option.label}
        </label>
      ))}
      <FieldMessages hint={hint} error={error} ids={ids} />
    </fieldset>
  );
}
