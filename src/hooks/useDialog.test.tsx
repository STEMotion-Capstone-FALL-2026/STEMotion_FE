import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { useDialog } from './useDialog';
afterEach(cleanup);
function Harness({ open, busy, close }: { open: boolean; busy: boolean; close: () => void }) {
  const ref = useDialog(open, 'Test dialog', close, busy);
  return <><button>Open</button>{open && <div ref={ref}><button>First</button><button>Last</button></div>}</>;
}
it('contains Tab focus, blocks Escape while busy and returns focus after closing', () => {
  const close = vi.fn();
  const view = render(<Harness open={false} busy={false} close={close} />);
  screen.getByRole('button', { name: 'Open' }).focus();
  view.rerender(<Harness open busy={false} close={close} />);
  const first = screen.getByRole('button', { name: 'First' });
  const last = screen.getByRole('button', { name: 'Last' });
  expect(document.activeElement).toBe(first);
  fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
  expect(document.activeElement).toBe(last);
  fireEvent.keyDown(document, { key: 'Tab' });
  expect(document.activeElement).toBe(first);
  view.rerender(<Harness open busy close={close} />);
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(close).not.toHaveBeenCalled();
  view.rerender(<Harness open busy={false} close={close} />);
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(close).toHaveBeenCalledTimes(1);
  view.rerender(<Harness open={false} busy={false} close={close} />);
  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Open' }));
});
