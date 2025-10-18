import { useEffect, type RefObject } from 'react';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea, input[type="text"], input[type="date"], input[type="number"], input[type="email"], select, [tabindex]:not([tabindex="-1"])';

export function useOverlayA11y(open: boolean, panelRef: RefObject<HTMLElement | null>, onClose?: () => void) {
  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    if (!panel) return;
    const previousActive = document.activeElement as HTMLElement | null;
    const focusable = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
      el => !el.hasAttribute('disabled'),
    );
    const first = focusable[0] || panel;
    const last = focusable[focusable.length - 1] || panel;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose?.();
        return;
      }
      if (event.key !== 'Tab') return;
      if (!focusable.length) {
        event.preventDefault();
        panel.focus();
        return;
      }
      const active = document.activeElement as HTMLElement | null;
      if (event.shiftKey) {
        if (active === first) {
          event.preventDefault();
          (last as HTMLElement).focus();
        }
      } else if (active === last) {
        event.preventDefault();
        (first as HTMLElement).focus();
      }
    };

    const handleWindowKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };

    const focusTimer = window.setTimeout(() => (first as HTMLElement).focus(), 0);
    panel.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keydown', handleWindowKey);

    return () => {
      window.clearTimeout(focusTimer);
      panel.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keydown', handleWindowKey);
      previousActive?.focus();
    };
  }, [open, panelRef, onClose]);
}

export default useOverlayA11y;
