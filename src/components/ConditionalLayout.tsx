'use client';

import { usePathname } from 'next/navigation';
import AppSidebar from "@/components/shell/AppSidebar";
import AppTopbar from "@/components/shell/AppTopbar";

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // For calendar-fullscreen, render without sidebar/topbar
  if (pathname === '/calendar-fullscreen') {
    return <>{children}</>;
  }
  
  // For all other routes, render with sidebar and topbar
  return (
    <div className="flex min-h-dvh">
      <AppSidebar />
      <div className="flex-1 min-w-0 relative z-10">
        <AppTopbar />
        <div className="p-3 md:p-6">{children}</div>
      </div>
    </div>
  );
}



