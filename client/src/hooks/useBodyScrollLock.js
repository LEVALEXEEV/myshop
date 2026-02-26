import { useEffect } from 'react';

export function useBodyScrollLock(active) {
  useEffect(() => {
    document.body.style.overflow = active ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [active]);
}
