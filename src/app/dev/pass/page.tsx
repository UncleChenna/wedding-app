import type { Metadata } from "next";

import { GatePass } from "@/modules/checkin/components/gate-pass";

export const metadata: Metadata = { title: "Gate pass preview", robots: { index: false } };

// Sample guest and a sample-length pass URL; the preview never signs or resolves a real pass.
const SAMPLE_URL =
  "https://uchenna-and-adaora.example.com/p/eyJ2IjoxLCJraWQiOiJrLTIwMjYtMTItMTktbWFpbiIsImludiI6IjZmMWMyYTRlLThiM2QtNGM1YS05ZTdmLTFhMmIzYzRkNWU2ZiIsInZlciI6MjE0NzQ4MzY0NywiaWF0IjoxNzk3NjkyNDAwfQ.KhgOQQC84ovGK7a2tqVdh2X3Ml4H0SAnXufmncr2ZmPBZm0w5XDu9vzV7mwI59wp4HRX8SkhQxz_h_Vku1LKAA";

export default function GatePassPreviewPage() {
  return (
    <GatePass
      passUrl={SAMPLE_URL}
      resolution={{
        state: "valid",
        pass: {
          names: ["Ngozi Okafor"],
          householdName: "The Okafor family",
          partySize: 3,
          tableNumber: 12,
        },
      }}
    />
  );
}
