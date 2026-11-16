"use client";

import { useRef, useState } from "react";
import { Button, type ButtonProps } from "./button";
import { Sheet } from "./sheet";

/** Preserve the original submitter's name/value and native form validation. */
export function ConfirmSubmitButton({
  confirmationTitle,
  confirmationDescription,
  confirmLabel = "Confirm",
  children,
  ...props
}: Omit<ButtonProps, "type" | "onClick"> & {
  confirmationTitle: string;
  confirmationDescription: string;
  confirmLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const submitter = useRef<HTMLButtonElement | null>(null);
  return (
    <>
      <Button
        {...props}
        type="submit"
        onClick={(event) => {
          event.preventDefault();
          const button = event.currentTarget;
          if (
            !button.form ||
            (!button.formNoValidate && !button.form.noValidate && !button.form.reportValidity())
          )
            return;
          submitter.current = button;
          setOpen(true);
        }}
      >
        {children}
      </Button>
      <Sheet
        open={open}
        onOpenChange={setOpen}
        title={confirmationTitle}
        description={confirmationDescription}
      >
        <div className="flex flex-wrap justify-end gap-3">
          <Button variant="secondary" size="lg" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            size="lg"
            onClick={() => {
              const button = submitter.current;
              setOpen(false);
              if (button?.isConnected && !button.disabled) button.form?.requestSubmit(button);
            }}
          >
            {confirmLabel}
          </Button>
        </div>
      </Sheet>
    </>
  );
}
