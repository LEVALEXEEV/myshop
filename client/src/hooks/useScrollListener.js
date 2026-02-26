import { useEffect } from 'react';

const useScrollListener = (callback) => {
  useEffect(() => {
    const handler = (e) => callback(e.detail);
    window.addEventListener('scrollToSection', handler);
    return () => window.removeEventListener('scrollToSection', handler);
  }, [callback]);
};

export default useScrollListener;
