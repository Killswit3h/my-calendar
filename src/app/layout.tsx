import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GFC Calendar",
  description: "Scheduling and job planning for Guaranteed Fence Corp.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
