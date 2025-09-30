"use client";

import { useEffect, useState } from 'react';

const KEY = 'ui-density';
export type Density = 'comfortable' | 'compact';

export function useDensity(): [Density, (d: Density) => void] {
  const [d, setD] = useState<Density>('comfortable');
  useEffect(() => {
    const stored = window.localStorage.getItem(KEY);
    if (stored === 'comfortable' || stored === 'compact') setD(stored);
  }, []);
  useEffect(() => { window.localStorage.setItem(KEY, d); }, [d]);
  return [d, setD];
}

