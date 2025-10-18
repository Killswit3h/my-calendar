import "./globals.css";
import type { Metadata } from "next";
import AppSidebar from "@/components/shell/AppSidebar";
import AppTopbar from "@/components/shell/AppTopbar";
import ConditionalLayout from "@/components/ConditionalLayout";

export const metadata: Metadata = {
  title: "GFC Control Center",
  description: "Operations Dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh">
        <ConditionalLayout>{children}</ConditionalLayout>
      </body>
    </html>
  );
}