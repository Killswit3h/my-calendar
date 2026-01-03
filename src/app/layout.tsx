import type { Metadata } from "next";
import "./globals.css";
import 'leaflet/dist/leaflet.css';
import Providers from "./providers";
import ConditionalLayout from "@/components/ConditionalLayout";

export const metadata: Metadata = {
  title: "GFC Calendar",
  description: "Scheduling and job planning for Guaranteed Fence Corp.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark h-full" suppressHydrationWarning style={{ colorScheme: "dark" }}>
      <body className="h-full">
        <Providers>
          <ConditionalLayout>{children}</ConditionalLayout>
        </Providers>
      </body>
    </html>
  );
}
