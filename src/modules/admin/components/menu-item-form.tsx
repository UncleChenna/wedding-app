"use client";
import { useActionState, useEffect, useRef, useState } from "react";
import { Button, Input, Select, Textarea } from "@/modules/shared/components/ui";
import {
  MENU_CATEGORY_OPTIONS,
  menuAdminCopy,
  STATION_OPTIONS,
  type MenuFormState,
} from "../lib/menu-item";
import type { AdminMenuItem } from "../server/menu-repository";
import { saveMenuItemAction } from "../server/menu-actions";

/** Add or edit one menu item. A new item has no station until the admin chooses one. */
export function MenuItemForm({ item }: { item?: AdminMenuItem }) {
  const [state, action, pending] = useActionState<MenuFormState, FormData>(saveMenuItemAction, {
    status: "idle",
  });
  const form = useRef<HTMLFormElement>(null);
  const prefix = item ? `menu-${item.id}` : "menu-new";
  const errors = state.status === "error" ? (state.fields ?? {}) : {};
  // React resets a form after its action; on an error, what was typed comes back as the defaults.
  const typed = state.status === "error" ? (state.values ?? {}) : {};
  // Selects don't take new defaults after a reset, so these two are controlled instead.
  const [category, setCategory] = useState<string>(item?.category ?? "");
  const [station, setStation] = useState<string>(item?.station ?? "");
  // After a new item is added, clear its choices too (adjusting state during render, not in an effect).
  const [handled, setHandled] = useState(state);
  if (handled !== state) {
    setHandled(state);
    if (state.status === "saved" && !item) {
      setCategory("");
      setStation("");
    }
  }
  useEffect(() => {
    if (state.status === "error")
      form.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, [state, item]);
  return (
    <form ref={form} action={action} noValidate className="space-y-6 [&_label]:text-base">
      {item && <input type="hidden" name="id" value={item.id} />}
      <Input
        id={`${prefix}-name`}
        name="name"
        label="Name"
        defaultValue={typed.name ?? item?.name}
        maxLength={80}
        required
        error={errors.name}
      />
      <Textarea
        id={`${prefix}-description`}
        name="description"
        label="Description"
        hint="Optional · up to 200 characters."
        defaultValue={typed.description ?? item?.description}
        maxLength={200}
        rows={2}
        error={errors.description}
      />
      <div className="grid gap-6 sm:grid-cols-2">
        <Select
          id={`${prefix}-category`}
          name="category"
          label="Category"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          required
          error={errors.category}
        >
          <option value="" disabled>
            Choose a category
          </option>
          {MENU_CATEGORY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        <Select
          id={`${prefix}-station`}
          name="station"
          label="Prepared by"
          hint="Orders for this item go to this board."
          value={station}
          onChange={(event) => setStation(event.target.value)}
          required
          error={errors.station}
        >
          <option value="" disabled>
            Choose the kitchen or the bar
          </option>
          {STATION_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        <Input
          id={`${prefix}-max`}
          name="maxPerOrder"
          label="Most per order"
          type="number"
          inputMode="numeric"
          min={1}
          max={100}
          defaultValue={typed.maxPerOrder ?? item?.maxPerOrder ?? 5}
          required
          error={errors.maxPerOrder}
        />
        <Input
          id={`${prefix}-sort`}
          name="sortOrder"
          label="Position"
          hint="Lower numbers appear first."
          type="number"
          inputMode="numeric"
          defaultValue={typed.sortOrder ?? item?.sortOrder ?? 0}
          error={errors.sortOrder}
        />
      </div>
      <Input
        id={`${prefix}-tags`}
        name="dietaryTags"
        label="Dietary tags"
        hint="Optional · separate with commas, e.g. vegan, gluten-free."
        defaultValue={typed.dietaryTags ?? item?.dietaryTags.join(", ")}
        error={errors.dietaryTags}
      />
      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" disabled={pending} aria-busy={pending}>
          {pending ? menuAdminCopy.saving : item ? menuAdminCopy.save : menuAdminCopy.add}
        </Button>
        <p role="status" className="text-lg leading-relaxed">
          {state.status === "idle" ? "" : state.message}
        </p>
      </div>
    </form>
  );
}
