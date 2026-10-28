"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  ActionBar,
  Button,
  Input,
  QuantityStepper,
  Select,
  Textarea,
} from "@/modules/shared/components/ui";
import { themeStyle, type Theme } from "@/modules/theming";
import {
  orderPreviewSchema,
  SAMPLE_CATEGORIES,
  SAMPLE_MENU,
  sampleTableSchema,
  type SampleCategory,
} from "../lib/order-preview";

type Step = "table" | "menu" | "review" | "received" | "served";
const titles: Record<Step, string> = {
  table: "Where are you sitting?",
  menu: "Hungry? Thirsty? Say the word.",
  review: "A little something for your table",
  received: "On its way. Sit back, we've got this.",
  served: "Enjoy every bite.",
};
export function OrderPreview({ themes }: { themes: readonly Theme[] }) {
  // "" follows the device light/dark setting, like the real site; a theme id pins the preview.
  const [themeId, setThemeId] = useState("");
  const [step, setStep] = useState<Step>("table");
  const [tableInput, setTableInput] = useState("");
  const [table, setTable] = useState<number | null>(null);
  const [category, setCategory] = useState<SampleCategory>("all");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const heading = useRef<HTMLHeadingElement>(null);
  const form = useRef<HTMLFormElement>(null);
  const theme = themes.find((theme) => theme.id === themeId);
  const selected = SAMPLE_MENU.filter((item) => (quantities[item.id] ?? 0) > 0);
  useEffect(() => {
    heading.current?.focus();
  }, [step]);
  useEffect(() => {
    if (Object.keys(errors).length)
      form.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, [errors]);
  function go(next: Step) {
    setErrors({});
    setStep(next);
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step === "table") {
      const result = sampleTableSchema.safeParse(tableInput);
      if (!result.success) {
        setErrors({ table: result.error.issues[0]?.message ?? "Choose a sample table." });
        return;
      }
      setTable(result.data);
      setTableInput(String(result.data));
      go("menu");
    } else if (step === "menu") {
      const result = orderPreviewSchema.safeParse({ table, quantities, note });
      if (!result.success) {
        setCategory("all");
        setErrors(
          Object.fromEntries(
            result.error.issues.map((issue) => [issue.path.join("."), issue.message]),
          ),
        );
        return;
      }
      setNote(result.data.note);
      go("review");
    } else if (step === "review") go("received");
  }
  return (
    <div
      style={theme && themeStyle(theme)}
      className="min-h-dvh bg-background font-sans text-foreground [&_label]:text-base [&_p]:text-base"
    >
      <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-6 px-6 py-6 md:px-12">
        <Link
          href="/dev"
          className="inline-flex min-h-11 items-center text-primary underline underline-offset-4"
        >
          Back to previews
        </Link>
        <div className="w-full max-w-xs">
          <Select
            id="order-preview-theme"
            label="Preview theme"
            value={themeId}
            onChange={(event) => setThemeId(event.target.value)}
          >
            <option value="">Match my device</option>
            {themes.map((theme) => (
              <option key={theme.id} value={theme.id}>
                {theme.name}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <main className="mx-auto max-w-3xl px-6 pt-8 pb-16 md:px-12 md:pt-12">
        <p className="mb-6 tracking-widest text-primary uppercase">
          {step === "table" ? "Uchenna & Adaora" : `Table ${table}`}
        </p>
        <h1
          ref={heading}
          tabIndex={-1}
          className="font-display text-4xl leading-tight tracking-tight focus:outline-none md:text-5xl"
        >
          {titles[step]}
        </h1>
        <p className="mt-6 leading-relaxed">
          Preview only. No orders are sent or saved. The tables, menu and service updates are
          samples.
        </p>
        {step === "received" || step === "served" ? (
          <section className="mt-10 space-y-8">
            <p className="font-medium text-primary">
              Sample status: {step === "received" ? "Received" : "Served"}
            </p>
            <p className="leading-relaxed">Nothing has been sent to the kitchen or bar.</p>
            <OrderSummary quantities={quantities} note={note} />
            {step === "received" ? (
              <Button onClick={() => go("served")}>Simulate service</Button>
            ) : (
              <Button
                onClick={() => {
                  setQuantities({});
                  setNote("");
                  setCategory("all");
                  go("menu");
                }}
              >
                Start another order
              </Button>
            )}
          </section>
        ) : (
          <form ref={form} onSubmit={submit} noValidate className="mt-10 space-y-8">
            {step === "table" && (
              <>
                <Input
                  id="order-table"
                  label="Table number"
                  inputMode="numeric"
                  value={tableInput}
                  onChange={(event) => setTableInput(event.target.value)}
                  error={errors.table}
                  hint="Choose a sample table from 1 to 30."
                  required
                  autoComplete="off"
                />
                {selected.length > 0 && (
                  <p className="leading-relaxed">
                    Your selections will stay with you when you change tables.
                  </p>
                )}
                <Button type="submit">Browse menu</Button>
              </>
            )}
            {step === "menu" && (
              <>
                <div aria-label="Menu categories" role="group" className="flex flex-wrap gap-2">
                  {SAMPLE_CATEGORIES.map((item) => (
                    <Button
                      key={item.value}
                      variant={category === item.value ? "secondary" : "ghost"}
                      aria-pressed={category === item.value}
                      onClick={() => setCategory(item.value)}
                    >
                      {item.label}
                    </Button>
                  ))}
                </div>
                <ul aria-label="Sample menu" className="space-y-8">
                  {SAMPLE_MENU.filter(
                    (item) => category === "all" || item.category === category,
                  ).map((item) => (
                    <li key={item.id} className="space-y-4 border-b border-border pb-8">
                      <h2 className="font-display text-3xl">{item.name}</h2>
                      <p className="leading-relaxed">{item.description}</p>
                      {item.available ? (
                        <QuantityStepper
                          id={`quantity-${item.id}`}
                          label={`${item.name} quantity`}
                          value={quantities[item.id] ?? 0}
                          min={0}
                          max={10}
                          step={1}
                          error={errors[`quantities.${item.id}`]}
                          onValueChange={(value) =>
                            setQuantities((quantities) => ({ ...quantities, [item.id]: value }))
                          }
                        />
                      ) : (
                        <p className="font-medium text-primary">Sold out in this sample menu</p>
                      )}
                    </li>
                  ))}
                </ul>
                <Textarea
                  id="order-note"
                  label="A note for the kitchen or bar"
                  hint="Optional · up to 200 characters."
                  maxLength={200}
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  error={errors.note}
                  rows={3}
                />
                <p className="leading-relaxed">Sample limit: up to 10 of each item.</p>
                {errors.quantities && (
                  <p role="alert" className="text-danger">
                    {errors.quantities}
                  </p>
                )}
                {/* The menu is long on a phone; keep the next step in thumb reach. */}
                <ActionBar
                  status={
                    selected.length === 0
                      ? "Your selection is empty. Choose something from the menu to continue."
                      : `${selected.length} menu ${selected.length === 1 ? "item" : "items"} selected. Review before previewing the order.`
                  }
                >
                  <Button type="submit" disabled={selected.length === 0}>
                    Review order
                  </Button>
                  <Button variant="ghost" onClick={() => go("table")}>
                    Change table
                  </Button>
                </ActionBar>
              </>
            )}
            {step === "review" && (
              <>
                <OrderSummary quantities={quantities} note={note} />
                <p className="leading-relaxed">
                  Continue to see a sample order status. Nothing will be sent.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Button type="submit">Preview order</Button>
                  <Button variant="ghost" onClick={() => go("menu")}>
                    Back to menu
                  </Button>
                </div>
              </>
            )}
          </form>
        )}
      </main>
    </div>
  );
}
function OrderSummary({ quantities, note }: { quantities: Record<string, number>; note: string }) {
  return (
    <div className="space-y-8">
      <ul aria-label="Order summary" className="space-y-4">
        {SAMPLE_MENU.filter((item) => (quantities[item.id] ?? 0) > 0).map((item) => (
          <li
            key={item.id}
            className="flex justify-between gap-6 border-b border-border pb-4 text-lg"
          >
            <span>{item.name}</span>
            <span aria-label={`Quantity ${quantities[item.id]}`}>× {quantities[item.id]}</span>
          </li>
        ))}
      </ul>
      {note && (
        <div>
          <h2 className="font-display text-2xl">Your note</h2>
          <p className="mt-3 leading-relaxed wrap-anywhere whitespace-pre-wrap">{note}</p>
        </div>
      )}
    </div>
  );
}
