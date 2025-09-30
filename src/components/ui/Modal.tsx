"use client";

import React, { useEffect, useRef } from 'react';
import { Button } from './Button';

export interface ModalProps {
  open: boolean;
  title?: string;
  onClose: () => void;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  widthClass?: string; // e.g., 'max-w-[560px]'
}

export function Modal({ open, title, onClose, children, footer, widthClass = 'max-w-[560px]' }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Basic focus trap
  useEffect(() => {
    if (!open || !panelRef.current) return;
    const prev = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const focusable = panel.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0] || panel;
    const last = focusable[focusable.length - 1] || panel;
    const onTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      if (focusable.length === 0) { e.preventDefault(); panel.focus(); return; }
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); (last as HTMLElement).focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); (first as HTMLElement).focus(); }
    };
    panel.addEventListener('keydown', onTab as any);
    // focus first
    setTimeout(() => (first as HTMLElement).focus(), 0);
    return () => {
      panel.removeEventListener('keydown', onTab as any);
      prev?.focus();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 backdrop-blur-sm" role="dialog" aria-modal="true" onClick={(e) => { if (e.currentTarget === e.target) onClose(); }}>
      <div ref={panelRef} className={[
        'w-[min(96vw,720px)]',
        widthClass,
        'rounded-modal border border-[var(--border)] shadow-level3 bg-[var(--surface)] text-fg p-4 outline-none',
      ].join(' ')} tabIndex={-1}>
        {title ? <h3 className="text-lg font-semibold mb-3">{title}</h3> : null}
        <div className="max-h-[70vh] overflow-auto">{children}</div>
        <div className="mt-4 flex justify-end gap-2">
          {footer ?? <Button variant="ghost" onClick={onClose}>Close</Button>}
        </div>
      </div>
    </div>
  );
}

export default Modal;

