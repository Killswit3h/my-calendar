import type { Metadata } from "next";
import "./globals.css";
import 'leaflet/dist/leaflet.css';
import Providers from "./providers";

export const metadata: Metadata = {
  title: "GFC Calendar",
  description: "Scheduling and job planning for Guaranteed Fence Corp.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
