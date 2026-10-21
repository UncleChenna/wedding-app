"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { cn } from "../../lib/cn";

export type ToastTone = "default" | "success" | "danger";

export interface ToastOptions {
  title: string;
  description?: string;
  tone?: ToastTone;
  /** Milliseconds before auto-dismiss. 0 keeps it until dismissed. */
  duration?: number;
}

interface ToastItem extends Required<Omit<ToastOptions, "description">> {
  id: number;
  description?: string;
}

interface ToastContextValue {
  toast: (options: ToastOptions) => number;
  dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const tones: Record<ToastTone, string> = {
  default: "border-border bg-surface text-foreground",
  success: "border-transparent bg-success text-success-foreground",
  danger: "border-transparent bg-danger text-danger-foreground",
};

export function ToastView({
  title,
  description,
  tone = "default",
  onDismiss,
}: Omit<ToastOptions, "duration"> & { onDismiss?: () => void }) {
  return (
    <div
      className={cn(
        "pointer-events-auto flex w-full items-start gap-3 rounded-md border p-4 shadow-lg",
        tones[tone],
      )}
    >
      <div className="flex flex-1 flex-col gap-0.5">
        <p className="text-sm font-semibold">{title}</p>
        {description && <p className="text-sm opacity-90">{description}</p>}
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss notification"
          className="-m-1.5 inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-sm opacity-80 hover:opacity-100"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="size-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
          </svg>
        </button>
      )}
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(1);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: number) => {
    setItems((current) => current.filter((item) => item.id !== id));
    const timer = timers.current.get(id);
    if (timer) clearTimeout(timer);
    timers.current.delete(id);
  }, []);

  const toast = useCallback(
    ({ title, description, tone = "default", duration = 4000 }: ToastOptions) => {
      const id = nextId.current++;
      setItems((current) => [...current, { id, title, description, tone, duration }]);
      if (duration > 0)
        timers.current.set(
          id,
          setTimeout(() => dismiss(id), duration),
        );
      return id;
    },
    [dismiss],
  );

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((timer) => clearTimeout(timer));
  }, []);

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext value={value}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col items-center gap-2 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:items-end"
      >
        {items.map((item) => (
          <div key={item.id} className="w-full max-w-sm">
            <ToastView {...item} onDismiss={() => dismiss(item.id)} />
          </div>
        ))}
      </div>
    </ToastContext>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside <ToastProvider>");
  return context;
}
