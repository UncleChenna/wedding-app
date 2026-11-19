"use client";
import { useEffect, useRef, useState } from "react";
import { Input, Select } from "@/modules/shared/components/ui";
import { guestPhoneCountries, joinGuestPhone, splitGuestPhone } from "../lib/guest-phone";

export function GuestPhoneInput({
  label,
  value,
  onChange,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  const [parts, setParts] = useState(() => splitGuestPhone(value));
  const emitted = useRef(value);
  useEffect(() => {
    if (value !== emitted.current) {
      emitted.current = value;
      setParts(splitGuestPhone(value));
    }
  }, [value]);
  function update(country: string, number: string) {
    const next = joinGuestPhone(country, number);
    emitted.current = next;
    setParts({ country, number });
    onChange(next);
  }
  return (
    <div className="min-w-0">
      <p aria-hidden="true" className="mb-1.5 text-sm font-medium text-foreground">
        {label}
      </p>
      <div className="grid grid-cols-[6.5rem_minmax(0,1fr)] items-start gap-2 [&_label]:sr-only [&>div]:min-w-0">
        <input type="hidden" name="memberPhone" value={value} />
        <Select
          label={`${label} country code`}
          className="px-2 pr-7"
          value={parts.country}
          onChange={(event) => update(event.target.value, parts.number)}
        >
          {guestPhoneCountries.map((c) => (
            <option key={c.code} value={c.code}>
              +{c.dial} · {c.label}
            </option>
          ))}
          <option value="OTHER">Other</option>
        </Select>
        <Input
          label={label}
          type="tel"
          autoComplete="tel-national"
          value={parts.number}
          maxLength={180}
          hint={parts.country === "OTHER" ? "Include + and your country code." : undefined}
          onChange={(event) => {
            const number = event.target.value;
            if (number.startsWith("+") || number.startsWith("00")) {
              const parsed = splitGuestPhone(number);
              update(parsed.country, parsed.number);
            } else update(parts.country, number);
          }}
          error={error}
        />
      </div>
    </div>
  );
}
