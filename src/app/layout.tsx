import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "leaflet/dist/leaflet.css";

import Providers from "./providers";
import { cn } from "@/lib/theme";

const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-inter" });

export const metadata: Metadata = {
  title: "GFC Control Center",
  description: "Unified operations dashboard and calendar for Guaranteed Fence Corp.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/* Use token-driven colors, not old background/foreground keys */}
      <body className={cn("min-h-dvh antialiased bg-[rgb(var(--bg))] text-[rgb(var(--fg))]", inter.variable)}>
        {/* Page container (adjust max-w as needed) */}
        <div className="mx-auto max-w-7xl p-4 sm:p-6">
          <Providers>{children}</Providers>
        </div>
      </body>
    </html>
  );
}
