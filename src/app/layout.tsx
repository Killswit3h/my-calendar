import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "GFC Control Center",
  description: "Operations Dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-dvh">
        {children}
      </body>
    </html>
  );
}