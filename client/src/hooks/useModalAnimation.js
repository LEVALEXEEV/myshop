import { useState, useEffect, useCallback } from 'react';

export function useModalAnimation(visible, onClose) {
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    document.body.style.overflow = visible || closing ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [visible, closing]);

  useEffect(() => {
    if (visible) {
      setClosing(false);
    }
  }, [visible]);

  const close = useCallback(() => {
    setClosing(true);
    setTimeout(() => {
      onClose();
      setClosing(false);
    }, 300);
  }, [onClose]);

  return { closing, close };
}
