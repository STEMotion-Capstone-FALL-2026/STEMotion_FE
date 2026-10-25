import { useEffect, useRef } from 'react';

const focusable = 'button, input, select, textarea, a[href], [tabindex]';

/** Keyboard containment and focus return for a mounted modal, including nested dialogs. */
export function useDialog(open: boolean, label: string, onClose?: () => void, busy = false) {
  const ref = useRef<HTMLDivElement>(null);
  const options = useRef({ onClose, busy });
  options.current = { onClose, busy };
  useEffect(() => {
    const dialog = ref.current;
    if (!open || !dialog) return;
    const previous = document.activeElement as HTMLElement | null;
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    if (!dialog.hasAttribute('aria-labelledby')) dialog.setAttribute('aria-label', label);
    dialog.tabIndex = -1;
    const elements = () => Array.from(dialog.querySelectorAll<HTMLElement>(focusable))
      .filter(el => !el.matches(':disabled') && el.tabIndex >= 0 && !el.closest('[hidden], [aria-hidden="true"]')
        && getComputedStyle(el).display !== 'none' && getComputedStyle(el).visibility !== 'hidden');
    (elements()[0] ?? dialog).focus();
    const handleKey = (event: KeyboardEvent) => {
      const dialogs = document.querySelectorAll('[role="dialog"][aria-modal="true"]');
      if (dialogs[dialogs.length - 1] !== dialog) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        if (!options.current.busy) options.current.onClose?.();
      }
      if (event.key !== 'Tab') return;
      const items = elements();
      const first = items[0];
      const last = items[items.length - 1];
      if (!first) { event.preventDefault(); dialog.focus(); }
      else if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) {
        event.preventDefault(); first.focus();
      }
    };
    document.addEventListener('keydown', handleKey, true);
    return () => {
      document.removeEventListener('keydown', handleKey, true);
      if (previous?.isConnected) previous.focus();
    };
  }, [open, label]);
  return ref;
}
