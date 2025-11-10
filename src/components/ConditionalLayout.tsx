'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import AppSidebar from '@/components/shell/AppSidebar';
import AppTopbar from '@/components/shell/AppTopbar';

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    const check = () => {
      if (typeof window === 'undefined') return;
      setIsMobile(window.innerWidth < 768);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  if (pathname === '/calendar-fullscreen') {
    return <>{children}</>;
  }

  if (isMobile) {
    return (
      <div className="min-h-screen bg-bg text-fg">
        <AppTopbar onToggleSidebar={() => setMobileNavOpen(true)} />
        {mobileNavOpen ? (
          <div className="fixed inset-0 z-40 flex">
            <button
              type="button"
              aria-label="Close navigation"
              className="absolute inset-0 bg-black/70"
              onClick={() => setMobileNavOpen(false)}
            />
            <div className="relative z-50 h-full w-[260px]">
              <AppSidebar
                current={pathname ?? '/'}
                className="h-full border-r border-white/10 bg-black/40 backdrop-blur-xl"
                style={{ width: '100%' }}
                onNavigate={() => setMobileNavOpen(false)}
              />
            </div>
          </div>
        ) : null}
        <main className="min-h-screen safe-p">
          <div className="container space-y-4">{children}</div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <AppSidebar current={pathname ?? '/'} />
      <div className="relative z-10 flex-1 min-w-0">
        <main className="safe-p">
          <div className="container space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
