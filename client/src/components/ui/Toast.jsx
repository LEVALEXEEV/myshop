import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

const Toast = ({
  message,
  onClose,
  duration = 5000,
  variant = 'default',
  style: userStyle = {},
}) => {
  const [animateOut, setAnimateOut] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setAnimateOut(true), duration);
    const t2 = setTimeout(onClose, duration + 300);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [duration, onClose]);

  const portalRoot = document.getElementById('portal-root');
  if (!portalRoot) return null;

  const bgClass =
    variant === 'error' ? 'bg-[#f95d51] text-white' : 'bg-black text-white';

  return createPortal(
    <div
      className={`
        fixed bottom-4 right-8 md:right-8
        z-[9999] font-arial
        px-6 py-4 rounded-lg shadow-lg
        w-[90%] max-w-[350px] md:w-full
        md:max-w-[350px]
        left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0
        ${bgClass}
        ${animateOut ? 'toast-exit' : 'toast-enter'}
      `}
      style={{
        ...userStyle,
      }}
    >
      <span className="block pr-6">{message}</span>
      <button
        onClick={() => {
          setAnimateOut(true);
          setTimeout(onClose, 300);
        }}
        className="absolute top-2 right-4 text-white text-2xl md:text-xl cursor-pointer"
        aria-label="Закрыть"
      >
        &times;
      </button>
    </div>,
    portalRoot
  );
};

export default Toast;
