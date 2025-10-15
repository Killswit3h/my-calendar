import "./globals.css";
import type { Metadata } from "next";
import AppSidebar from "@/components/shell/AppSidebar";
import AppTopbar from "@/components/shell/AppTopbar";

export const metadata: Metadata = {
  title: "GFC Control Center",
  description: "Operations Dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh">
        <div className="flex min-h-dvh">
          <AppSidebar />
          <div className="flex-1 min-w-0 relative z-10">
            <AppTopbar />
            <div className="p-3 md:p-6">{children}</div>
          </div>
        </div>
      </body>
    </html>
  );
}