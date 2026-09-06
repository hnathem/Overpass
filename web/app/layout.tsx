import type { Metadata } from "next";

import { AppShell } from "@/components/AppShell";
import { AppProviders } from "@/lib/providers";

import "./globals.css";

export const metadata: Metadata = {
  title: "Overpass — Mission Control",
  description: "Schedule satellite-to-ground-station contacts without double-booking an antenna.",
};

// Applied before the page paints so there's no flash of the wrong theme.
// Dark is the default; the toggle can switch to light and it's remembered.
const themeInitScript = `
(function () {
  try {
    document.documentElement.dataset.theme = localStorage.getItem("overpass-theme") || "dark";
  } catch (e) {
    document.documentElement.dataset.theme = "dark";
  }
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans">
        <AppProviders>
          <AppShell>{children}</AppShell>
        </AppProviders>
      </body>
    </html>
  );
}
