import type { Metadata, Viewport } from "next";

import { ToastProvider } from "@/modules/shared/components/ui";
import { getActiveTheme, themeStyle } from "@/modules/theming";
import { fontVariables } from "@/modules/theming/components/fonts";

import "./globals.css";

const theme = getActiveTheme();

export const metadata: Metadata = {
  title: { default: "Our Wedding", template: "%s · Our Wedding" },
  description: "Celebrate with us.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: theme.colors.background,
  colorScheme: theme.colorScheme,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // The theme's CSS variables are rendered on the server, so there is no flash of the wrong theme.
    <html lang="en" data-theme={theme.id} style={themeStyle(theme)} className={fontVariables}>
      <body className="min-h-dvh bg-background font-sans text-foreground">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
