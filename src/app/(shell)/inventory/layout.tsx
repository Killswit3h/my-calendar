// Removed module; redirect to 404
import { notFound } from "next/navigation";
export default function Layout() {
  notFound();
}
export default function Layout({ children }: { children: React.ReactNode }) { return <>{children}</>; }
