"use client";
import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Button, Sheet } from "@/modules/shared/components/ui";

export function AddInvitationModal({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  function changeOpen(next: boolean) {
    setOpen(next);
    if (!next) router.refresh();
  }
  return (
    <>
      <Button onClick={() => setOpen(true)} aria-haspopup="dialog">
        Add an invitation
      </Button>
      <Sheet
        open={open}
        onOpenChange={changeOpen}
        title="Add an invitation"
        description="Add your guest, then preview and send their invitation."
        className="max-h-[calc(100dvh-1rem)] overflow-y-auto overscroll-contain sm:max-h-[90dvh] sm:w-[calc(100%-2rem)] sm:max-w-3xl"
      >
        {open && children}
      </Sheet>
    </>
  );
}
