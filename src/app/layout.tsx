import type { Metadata, Viewport } from "next";

import { InstallPromptRegistration } from "@/modules/shared/components/install-prompt";
import { ServiceWorkerRegistration } from "@/modules/shared/components/service-worker-registration";
import { ToastProvider } from "@/modules/shared/components/ui";
import { getStoredActiveThemes } from "@/modules/theming/server/active-themes";
import { fontVariables } from "@/modules/theming/components/fonts";
import { ThemeStyles } from "@/modules/theming/components/theme-styles";

import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Our Wedding", template: "%s · Our Wedding" },
  description: "Celebrate with us.",
};

export async function generateViewport(): Promise<Viewport> {
  const themes = await getStoredActiveThemes();
  return {
    width: "device-width",
    initialScale: 1,
    viewportFit: "cover",
    // The browser bar follows the device setting, like the page.
    themeColor: [
      { media: "(prefers-color-scheme: light)", color: themes.light.colors.background },
      { media: "(prefers-color-scheme: dark)", color: themes.dark.colors.background },
    ],
    colorScheme: "light dark",
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const themes = await getStoredActiveThemes();
  return (
    // Both themes are rendered on the server as one stylesheet keyed on prefers-color-scheme,
    // so each device paints its own theme first, with no flash and no client JS.
    <html lang="en" className={fontVariables}>
      <head>
        <ThemeStyles themes={themes} />
      </head>
      <body className="min-h-dvh bg-background font-sans text-foreground">
        <ToastProvider>{children}</ToastProvider>
        <ServiceWorkerRegistration />
        <InstallPromptRegistration />
      </body>
    </html>
  );
}
