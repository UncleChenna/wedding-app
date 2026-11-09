"use client";
import { Button } from "@/modules/shared/components/ui";
export function PrintGateButton() {
  return (
    <Button size="lg" onClick={() => window.print()}>
      Print or save PDF
    </Button>
  );
}
