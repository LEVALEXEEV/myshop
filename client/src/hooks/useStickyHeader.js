import { useState, useRef, useEffect, useCallback } from 'react';

export function useStickyHeader(containerRef) {
  const prevScrolled = useRef(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [animClass, setAnimClass] = useState('');

  const onScroll = useCallback(() => {
    const c = containerRef.current ?? window;
    const y = c === window ? window.scrollY : c.scrollTop;
    const sc = y > 0;
    if (sc !== prevScrolled.current) {
      prevScrolled.current = sc;
      setIsScrolled(sc);
      setAnimClass('animate-slideDown');
    }
  }, [containerRef]);

  useEffect(() => {
    const c = containerRef.current ?? window;
    c.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => c.removeEventListener('scroll', onScroll);
  }, [containerRef, onScroll]);

  const clearAnim = useCallback(() => {
    setAnimClass('');
  }, []);

  return { isScrolled, animClass, clearAnim };
}
