"use client";

import { useEffect, useState } from "react";
import { Button } from "@/modules/shared/components/ui/button";
import { Monogram } from "@/modules/shared/components/ui/decorations";
import "./envelope.css";

const seenKey = "wedding:envelope-opened:v1";

/** Decorative motion only: invitation content never waits for this component. */
export function Envelope({
  initials,
  returning = false,
}: {
  initials: readonly [string, string];
  returning?: boolean;
}) {
  const [opening, setOpening] = useState(false);
  const [ready, setReady] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const preference = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    const frame = requestAnimationFrame(() => {
      let seen = returning;
      try {
        seen ||= localStorage.getItem(seenKey) === "1";
        localStorage.setItem(seenKey, "1");
      } catch {
        // Private browsers may deny storage; decoration must never block the letter.
      }
      setReduced(preference?.matches ?? false);
      setReady(true);
      setOpening(!seen && !preference?.matches);
    });
    const change = () => {
      setReduced(preference?.matches ?? false);
      if (preference?.matches) setOpening(false);
    };
    preference?.addEventListener("change", change);
    return () => {
      cancelAnimationFrame(frame);
      preference?.removeEventListener("change", change);
    };
  }, [returning]);

  useEffect(() => {
    if (!opening) return;
    const timer = setTimeout(() => setOpening(false), 600);
    return () => clearTimeout(timer);
  }, [opening]);

  return (
    <div className="invitation-envelope-envelope" data-envelope data-opening={opening}>
      <div className="invitation-envelope-illustration" aria-hidden="true">
        <svg className="invitation-envelope-outline" viewBox="0 0 280 210" fill="none">
          <path d="M20 86 L140 16 L260 86 V192 H20 Z" stroke="currentColor" />
        </svg>
        <div className="invitation-envelope-letter">
          <Monogram initials={initials} decorative />
        </div>
        <svg className="invitation-envelope-outline" viewBox="0 0 280 210" fill="none">
          <path
            d="M20 86 L140 158 L260 86 V192 H20 Z"
            className="invitation-envelope-front"
            stroke="currentColor"
          />
          <path d="M20 192 L112 141 M260 192 L168 141" stroke="currentColor" />
        </svg>
        <svg className="invitation-envelope-flap" viewBox="0 0 280 210" fill="none">
          <path
            d="M20 86 L140 158 L260 86 Z"
            className="invitation-envelope-front"
            stroke="currentColor"
          />
        </svg>
      </div>
      <div className="invitation-envelope-controlSpace">
        {ready && !reduced && (
          <Button
            variant="ghost"
            className="invitation-envelope-control"
            onClick={() => setOpening(!opening)}
          >
            <span className="invitation-envelope-controlLabel">
              {opening ? "Skip opening" : "Replay opening"}
            </span>
          </Button>
        )}
      </div>
    </div>
  );
}
