"use client";
import { useEffect, useRef } from "react";
/** Successful deletion leaves a surviving destination for keyboard focus. */
export function DraftDeletedNotice() {
  const notice = useRef<HTMLParagraphElement>(null);
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
