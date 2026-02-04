"use client";

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

export interface AppHeaderProps {
  title: string;
  right?: React.ReactNode;
}

export function AppHeader({ title, right }: AppHeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <div className={[
      'sticky top-0 z-40',
      'backdrop-blur-[var(--glass-blur-12)]',
      'bg-[color-mix(in_srgb,var(--bg)_60%,transparent)]',
      'border-b', scrolled ? 'border-[var(--border)]' : 'border-[color-mix(in_srgb,var(--border)_50%,transparent)]',
    ].join(' ')}>
      <div className="max-w-[1200px] mx-auto px-4 h-14 flex items-center justify-between">
        <div className="text-lg font-semibold select-none">{title}</div>
        <div className="flex items-center gap-2">
          {right ?? <Button variant="ghost">Options</Button>}
        </div>
      </div>
    </div>
  );
}

export default AppHeader;

