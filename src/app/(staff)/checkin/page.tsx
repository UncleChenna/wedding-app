import type { Metadata } from "next";
import { StaffEntry } from "@/modules/shared/components/staff-entry";

export const metadata: Metadata = { title: "Gate check-in", robots: { index: false } };

export default function Page() {
  return <StaffEntry role="gate" />;
}
