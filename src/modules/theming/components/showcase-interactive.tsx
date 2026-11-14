"use client";

import { useState } from "react";
import { ConfirmSubmitButton } from "@/modules/shared/components/ui/confirm-submit-button";

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Sheet,
  useToast,
} from "@/modules/shared/components/ui";

/** Live Sheet and Toast triggers for /dev/theme. */
export function ShowcaseInteractive() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sheet &amp; toast</CardTitle>
        <CardDescription>Bottom sheet on phones, dialog on desktop.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-3">
        <Button variant="secondary" onClick={() => setOpen(true)}>
          Open sheet
        </Button>
        <Button
          variant="ghost"
          onClick={() =>
            toast({
              title: "Order sent",
              description: "The bar has your drinks.",
              tone: "success",
            })
          }
        >
          Show toast
        </Button>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            toast({ title: "Preview reset", tone: "success" });
          }}
        >
          <ConfirmSubmitButton
            confirmationTitle="Reset preview?"
            confirmationDescription="This only resets the sample preview."
            confirmLabel="Reset preview"
            variant="secondary"
          >
            Confirm an action
          </ConfirmSubmitButton>
        </form>
        <Button
          variant="ghost"
          onClick={() =>
            toast({ title: "We couldn’t save just now. Please try again.", tone: "danger" })
          }
        >
          Show error
        </Button>
      </CardContent>
      <Sheet open={open} onOpenChange={setOpen} title="Your order" description="Table 7 · 2 items">
        <p className="text-muted-foreground">Sheets hold short flows like confirming an order.</p>
        <div className="flex flex-col gap-2 sm:flex-row-reverse">
          <Button onClick={() => setOpen(false)}>Place order</Button>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Keep browsing
          </Button>
        </div>
      </Sheet>
    </Card>
  );
}
