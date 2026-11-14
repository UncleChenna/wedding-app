"use client";
import { useEffect, useRef } from "react";
import { useOptionalToast } from "@/modules/shared/components/ui/toast";
/** Successful deletion leaves a surviving destination for keyboard focus. */
export function DraftDeletedNotice() {
  const notice = useRef<HTMLParagraphElement>(null);
  const notifications = useOptionalToast();
  const announced = useRef(false);
  useEffect(() => {
    if (announced.current || !notifications) return;
    announced.current = true;
    notifications.toast({ title: "Draft invitation deleted.", tone: "success" });
  }, [notifications]);
  useEffect(() => notice.current?.focus(), []);
  return (
    <p
      ref={notice}
      role="status"
      tabIndex={-1}
      className="mb-6 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
    >
      Draft invitation deleted.
    </p>
  );
}
