"use client";
import { themeStyle, type Theme } from "@/modules/theming";
import { themeSchema } from "@/modules/theming/lib/schema";
import { InvitationView } from "@/modules/invitations/components/invitation-view";
import { OrderPreview } from "@/modules/ordering/components/order-preview";
export function ThemePreview({ theme, page }: { theme: Theme; page: "invitation" | "order" }) {
  // Incomplete hex input is never interpolated into CSS.
  const parsed = themeSchema.safeParse(theme);
  if (!parsed.success) return <p>Complete the colour values to see the preview.</p>;
  return (
    <div
      aria-label="Draft page preview"
      role="region"
      style={themeStyle(parsed.data)}
      className="min-w-0 border border-border bg-background font-sans text-foreground"
    >
      {page === "invitation" ? (
        <InvitationView
          embedded
          details={{
            names: ["Uchenna", "Adaora"],
            date: "19 December 2026",
            time: "Time to follow",
            venue: "Sample Garden",
            address: "Sample location",
            dressCode: "Dress code to follow",
          }}
        />
      ) : (
        <OrderPreview themes={[]} embedded />
      )}
    </div>
  );
}
