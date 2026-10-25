import { useRef, useState } from 'react';

/** A synchronous lock: two clicks in the same render cannot start two mutations. */
export function useActionGuard() {
  const locked = useRef(false);
  const [pending, setPending] = useState(false);
  const wrap = <Args extends unknown[], Result,>(action: (...args: Args) => Promise<Result>) =>
    async (...args: Args): Promise<Result | undefined> => {
      if (locked.current) return;
      locked.current = true;
      setPending(true);
      try { return await action(...args); }
      finally { locked.current = false; setPending(false); }
    };
  return { pending, wrap };
}
