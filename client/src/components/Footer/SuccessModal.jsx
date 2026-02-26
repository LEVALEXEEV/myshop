import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

const SuccessModal = ({
  message = 'Спасибо! Данные успешно отправлены.',
  onClose,
}) => {
  const [visible, setVisible] = useState(false);
  const portalRoot = document.getElementById('portal-root');
  if (!portalRoot) return null;

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 300);
  };

  return createPortal(
    <div
      className={`
        fixed inset-0 z-[10000] flex items-center justify-center
        bg-black/80
        transition-opacity duration-300
        ${visible ? 'opacity-100' : 'opacity-0'}
      `}
      onClick={handleClose}
    >
      <div
        className={`
          bg-white box-border px-[40px] pt-[40px] pb-[50px]
          rounded-[5px] shadow-lg max-w-[360px] text-center relative
          transform transition-all duration-300
          ${visible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}
        `}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleClose}
          className="absolute top-[14px] right-[14px] cursor-pointer"
          aria-label="Закрыть"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 23 23"
          >
            <g fillRule="evenodd">
              <path d="M0 1.41L1.4 0l21.22 21.21-1.41 1.42z" />
              <path d="M21.21 0l1.42 1.4L1.4 22.63 0 21.21z" />
            </g>
          </svg>
        </button>

        <div className="mb-5">
          <svg width="50" height="50" fill="#62C584" className="mx-auto">
            <path d="M25.1 49.28A24.64 24.64 0 0 1 .5 24.68 24.64 24.64 0 0 1 25.1.07a24.64 24.64 0 0 1 24.6 24.6 24.64 24.64 0 0 1-24.6 24.61zm0-47.45A22.87 22.87 0 0 0 2.26 24.68 22.87 22.87 0 0 0 25.1 47.52a22.87 22.87 0 0 0 22.84-22.84A22.87 22.87 0 0 0 25.1 1.83z" />
            <path d="M22.84 30.53l-4.44-4.45a.88.88 0 1 1 1.24-1.24l3.2 3.2 8.89-8.9a.88.88 0 1 1 1.25 1.26L22.84 30.53z" />
          </svg>
        </div>

        <p className="text-black font-light text-lg leading-[1.55]">
          {message}
        </p>
      </div>
    </div>,
    portalRoot
  );
};

export default SuccessModal;
