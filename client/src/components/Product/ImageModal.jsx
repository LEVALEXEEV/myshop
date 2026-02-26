import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

const isVideo = (src) => /\.(mp4|webm)$/i.test(src);

export default function ImageModal({
  isOpen,
  images,
  activeIndex,
  onClose,
  onPrev,
  onNext,
}) {
  const [isMobile, setIsMobile] = useState(false);
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(isOpen);
  const sliderRef = useRef(null);

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 768px)');
    const onChange = (e) => setIsMobile(e.matches);
    mql.addEventListener('change', onChange);
    setIsMobile(mql.matches);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    let showT, hideT;
    if (isOpen) {
      setMounted(true);
      setVisible(false);
      showT = setTimeout(() => setVisible(true), 20);
    } else {
      setVisible(false);
      hideT = setTimeout(() => setMounted(false), 300);
    }
    return () => {
      clearTimeout(showT);
      clearTimeout(hideT);
    };
  }, [isOpen]);

  useEffect(() => {
    if (sliderRef.current) {
      const offset = -(activeIndex * (100 / images.length));
      sliderRef.current.style.transform = `translateX(${offset}%)`;
    }
  }, [activeIndex, images.length]);

  if (!mounted) return null;

  return createPortal(
    <div
      className={`
        fixed inset-0 bg-white flex items-center justify-center overflow-hidden z-[9999]
        transition-opacity duration-300 ease-in-out
        ${visible ? 'opacity-100' : 'opacity-0'}
      `}
      onClick={onClose}
    >
      <div
        className="relative w-full h-screen md:h-auto py-4 md:px-4 flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Закрыть"
          className="absolute top-4 md:top-8 right-4 md:right-8 text-black text-3xl z-10"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 26 26"
            className="w-[26px] h-[26px]"
          >
            <g fill="#000" fillRule="evenodd">
              <rect
                transform="rotate(-45 11.31 11.31)"
                x="10.31"
                y="-3.69"
                width="2"
                height="30"
              />
              <rect
                transform="rotate(-315 11.31 11.31)"
                x="10.31"
                y="-3.69"
                width="2"
                height="30"
              />
            </g>
          </svg>
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onPrev();
          }}
          aria-label="Предыдущее"
          className="absolute flex justify-center min-h-12 min-w-12 items-center left-0 md:left-2 top-1/2 -translate-y-1/2 text-black text-4xl z-10"
        >
          <svg
            viewBox="0 0 13.3 25"
            xmlns="http://www.w3.org/2000/svg"
            className="rotate-180 w-[13px] h-[25px]"
          >
            <polyline
              fill="none"
              stroke="#000"
              strokeWidth="1"
              points="0.5,0.5 12.5,12.5 0.5,24.5"
            />
          </svg>
        </button>

        <div className="relative w-full h-full overflow-hidden">
          <div
            ref={sliderRef}
            className="flex transition-transform duration-500 ease-in-out h-full"
            style={{
              width: `${images.length * 100}%`,
              transform: `translateX(-${activeIndex * (100 / images.length)}%)`,
            }}
          >
            {images.map((src, idx) => (
              <div
                key={idx}
                className="flex-shrink-0 flex items-center justify-center"
                style={{ width: `${100 / images.length}%` }}
              >
                {isVideo(src) ? (
                  <video
                    src={src}
                    muted
                    autoPlay
                    loop
                    playsInline
                    className="
                      w-auto object-cover
                      md:h-auto md:w-full md:object-contain
                      md:max-h-screen md:max-w-full
                    "
                    onClick={isMobile ? onClose : undefined}
                  />
                ) : (
                  <img
                    src={src}
                    alt={`Product ${idx + 1}`}
                    className="
                      w-auto object-cover
                      md:h-auto md:w-full md:object-contain
                      md:max-h-screen md:max-w-full
                    "
                    onClick={isMobile ? onClose : undefined}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
          aria-label="Следующее"
          className="absolute flex justify-center min-h-12 min-w-12 items-center right-0 md:right-2 top-1/2 -translate-y-1/2 text-black text-4xl z-10"
        >
          <svg
            viewBox="0 0 13.3 25"
            xmlns="http://www.w3.org/2000/svg"
            className="w-[13px] h-[25px]"
          >
            <polyline
              fill="none"
              stroke="#000"
              strokeWidth="1"
              points="0.5,0.5 12.5,12.5 0.5,24.5"
            />
          </svg>
        </button>
      </div>
    </div>,
    document.body
  );
}
