"use client";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type SelectHTMLAttributes,
  type KeyboardEvent,
} from "react";
import { cn } from "../../lib/cn";
import { controlClasses, FieldMessages, useFieldIds, type FieldMessageProps } from "./field";

export interface SelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "multiple" | "size">, FieldMessageProps {
  label: string;
}
const subscribe = () => () => {};
/** Custom menu; a hidden native control preserves HTML form semantics and no-JS fallback. */
export function Select({
  label,
  hint,
  error,
  id,
  className,
  children,
  onChange,
  onInvalid,
  ...props
}: SelectProps) {
  const hydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const ids = useFieldIds({ id, hint, error });
  const native = useRef<HTMLSelectElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [revision, setRevision] = useState(0);
  const [invalid, setInvalid] = useState(false);
  const [options, setOptions] = useState<
    { value: string; text: string; display: string; disabled: boolean }[]
  >([]);
  const [selected, setSelected] = useState("");
  const buffer = useRef({ text: "", at: 0 });
  const listId = `${ids.controlId}-listbox`;
  useLayoutEffect(() => {
    const el = native.current;
    if (!el) return;
    setOptions(
      Array.from(el.options, (option) => ({
        value: option.value,
        text: option.label,
        display: option.dataset.display ?? option.label,
        disabled:
          option.disabled ||
          (option.parentElement instanceof HTMLOptGroupElement && option.parentElement.disabled),
      })),
    );
    setSelected(el.value);
  }, [children, props.value, props.defaultValue, revision]);
  useEffect(() => {
    const form = native.current?.form;
    function reset() {
      setOpen(false);
      setInvalid(false);
      setTimeout(() => setRevision((n) => n + 1), 0);
    }
    form?.addEventListener("reset", reset);
    return () => form?.removeEventListener("reset", reset);
  }, []);
  useLayoutEffect(() => {
    if (!open || !menu.current || !trigger.current) return;
    const list = menu.current;
    function position() {
      const button = trigger.current;
      if (!button) return;
      const rect = button.getBoundingClientRect();
      const view = window.visualViewport;
      const width = view?.width ?? window.innerWidth;
      const height = view?.height ?? window.innerHeight;
      const left = view?.offsetLeft ?? 0;
      const top = view?.offsetTop ?? 0;
      const below = top + height - rect.bottom - 8;
      const above = rect.top - top - 8;
      const upward = below < 180 && above > below;
      const room = Math.max(44, Math.min(320, upward ? above : below));
      const menuWidth = Math.min(Math.max(rect.width, 220), width - 16);
      Object.assign(list.style, {
        position: "fixed",
        margin: "0",
        inset: "auto",
        left: `${Math.max(left + 8, Math.min(rect.left, left + width - menuWidth - 8))}px`,
        top: `${upward ? Math.max(top + 8, rect.top - Math.min(list.scrollHeight, room) - 4) : rect.bottom + 4}px`,
        width: `${menuWidth}px`,
        maxHeight: `${room}px`,
      });
    }
    list.showPopover?.();
    position();
    window.addEventListener("resize", position);
    window.addEventListener("scroll", position, true);
    window.visualViewport?.addEventListener("resize", position);
    function outside(event: PointerEvent) {
      if (event.target instanceof Node && !root.current?.contains(event.target)) setOpen(false);
    }
    document.addEventListener("pointerdown", outside);
    return () => {
      list.hidePopover?.();
      window.removeEventListener("resize", position);
      window.removeEventListener("scroll", position, true);
      window.visualViewport?.removeEventListener("resize", position);
      document.removeEventListener("pointerdown", outside);
    };
  }, [open]);
  useEffect(() => {
    if (open)
      menu.current
        ?.querySelector(`[data-index="${active}"]`)
        ?.scrollIntoView?.({ block: "nearest" });
  }, [active, open]);
  function disabled() {
    return Boolean(props.disabled || native.current?.matches(":disabled"));
  }
  function expand() {
    if (disabled()) return;
    const current = options.findIndex((option) => option.value === selected && !option.disabled);
    setActive(
      current >= 0
        ? current
        : Math.max(
            0,
            options.findIndex((option) => !option.disabled),
          ),
    );
    setOpen(true);
  }
  function choose(index: number) {
    const option = options[index];
    if (!option || option.disabled || disabled() || !native.current) return;
    native.current.value = option.value;
    native.current.dispatchEvent(new Event("change", { bubbles: true }));
    setRevision((n) => n + 1);
    setInvalid(false);
    setOpen(false);
  }
  function keyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (disabled()) return;
    const key = event.key;
    if (key === "Escape" && open) {
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
      return;
    }
    if (key === "Tab") {
      if (open) choose(active);
      return;
    }
    if (["Enter", " "].includes(key)) {
      event.preventDefault();
      if (open) choose(active);
      else expand();
      return;
    }
    const enabled = options
      .map((option, index) => (option.disabled ? -1 : index))
      .filter((index) => index >= 0);
    if (["ArrowDown", "ArrowUp", "Home", "End"].includes(key)) {
      event.preventDefault();
      if (!open) {
        expand();
        if (key === "End") setActive(enabled.at(-1) ?? 0);
        if (key === "Home") setActive(enabled[0] ?? 0);
        return;
      }
      const index = Math.max(0, enabled.indexOf(active));
      setActive(
        enabled[
          key === "Home"
            ? 0
            : key === "End"
              ? enabled.length - 1
              : Math.min(enabled.length - 1, Math.max(0, index + (key === "ArrowDown" ? 1 : -1)))
        ] ?? 0,
      );
    } else if (key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault();
      const now = Date.now();
      const text =
        now - buffer.current.at < 700 ? buffer.current.text + key.toLowerCase() : key.toLowerCase();
      buffer.current = { text, at: now };
      const repeated = [...text].every((char) => char === text[0]);
      const query = repeated ? key.toLowerCase() : text;
      const ordered = repeated
        ? [...enabled.filter((i) => i > active), ...enabled.filter((i) => i <= active)]
        : enabled;
      const match = ordered.find((i) => options[i]?.text.toLowerCase().startsWith(query));
      if (!open) expand();
      if (match !== undefined) setActive(match);
    }
  }
  const message = error || (invalid ? "Choose an option." : undefined);
  const display =
    options.find((option) => option.value === selected)?.display ?? "Choose an option";
  return (
    <div ref={root} className="flex min-w-0 flex-col gap-1.5">
      <label
        htmlFor={hydrated ? ids.controlId : `${ids.controlId}-native`}
        className="text-sm font-medium text-foreground"
      >
        {label}
      </label>
      <select
        {...props}
        id={`${ids.controlId}-native`}
        ref={native}
        hidden={hydrated}
        aria-hidden={hydrated || undefined}
        tabIndex={hydrated ? -1 : props.tabIndex}
        aria-invalid={ids.invalid || undefined}
        aria-describedby={ids.describedBy}
        className={cn(controlClasses, "min-h-11 w-full", error && "border-danger", className)}
        onChange={(event) => {
          setSelected(event.currentTarget.value);
          setInvalid(false);
          onChange?.(event);
        }}
        onInvalid={(event) => {
          if (hydrated) {
            event.preventDefault();
            setInvalid(true);
            trigger.current?.focus();
          }
          onInvalid?.(event);
        }}
      >
        {children}
      </select>
      <button
        ref={trigger}
        hidden={!hydrated}
        id={ids.controlId}
        type="button"
        value={selected}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open ? `${listId}-${active}` : undefined}
        aria-required={props.required || undefined}
        aria-invalid={Boolean(message) || undefined}
        aria-describedby={
          message ? [ids.hintId, ids.errorId].filter(Boolean).join(" ") : ids.describedBy
        }
        disabled={props.disabled}
        autoFocus={props.autoFocus}
        tabIndex={props.tabIndex}
        className={cn(
          controlClasses,
          "relative flex min-h-11 w-full items-center justify-between gap-2 text-left",
          message && "border-danger",
          className,
        )}
        onClick={() => (open ? setOpen(false) : expand())}
        onKeyDown={keyDown}
        onBlur={() => {
          if (open) {
            choose(active);
            setOpen(false);
          }
        }}
      >
        <span className="min-w-0 truncate">{display}</span>
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="size-4 shrink-0"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div
          ref={menu}
          id={listId}
          role="listbox"
          aria-label={label}
          popover={
            typeof HTMLElement !== "undefined" && "showPopover" in HTMLElement.prototype
              ? "manual"
              : undefined
          }
          className="z-50 overflow-y-auto overscroll-contain rounded-md border border-border bg-surface p-1 text-foreground shadow-lg"
        >
          {options.map((option, index) => (
            <div
              key={`${option.value}-${index}`}
              id={`${listId}-${index}`}
              role="option"
              aria-selected={option.value === selected}
              aria-disabled={option.disabled || undefined}
              data-value={option.value}
              data-index={index}
              onPointerDown={(event) => event.preventDefault()}
              onClick={() => choose(index)}
              onPointerMove={() => {
                if (!option.disabled) setActive(index);
              }}
              className={cn(
                "flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-sm px-3 py-2 text-base break-words",
                active === index && "bg-surface-muted",
                option.disabled && "cursor-not-allowed opacity-50",
              )}
            >
              <span>{option.text}</span>
              {option.value === selected && <span aria-hidden="true">✓</span>}
            </div>
          ))}
        </div>
      )}
      <FieldMessages hint={hint} error={message} ids={ids} />
    </div>
  );
}
