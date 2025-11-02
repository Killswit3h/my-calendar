import "./globals.css";
import type { Metadata } from "next";
import ConditionalLayout from "@/components/ConditionalLayout";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "GFC Control Center",
  description: "Operations Dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh">
        <Providers>
          <ConditionalLayout>{children}</ConditionalLayout>
        </Providers>
      </body>
    </html>
  );
}
