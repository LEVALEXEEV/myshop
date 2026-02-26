import { memo, useState, useRef, useCallback, useEffect } from 'react';
import ImageModal from './ImageModal';

const isVideo = (src) => /\.(mp4|webm)$/i.test(src);

const ImageGalleryComponents = ({
  allImages,
  activeIndex,
  onChangeIndex,
  soldOut = false,
}) => {
  const [zoom, setZoom] = useState(false);
  const [zoomStyle, setZoomStyle] = useState({});
  const [isHoverable, setIsHoverable] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const zoomRef = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mql = window.matchMedia('(hover: hover) and (pointer: fine)');
      setIsHoverable(mql.matches);
      const listener = (e) => setIsHoverable(e.matches);
      mql.addEventListener('change', listener);
      return () => mql.removeEventListener('change', listener);
    }
  }, []);

  const handleMouseMove = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoom(true);
    setZoomStyle({
      transformOrigin: `${x}% ${y}%`,
      transform: 'scale(2)',
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setZoom(false);
    setZoomStyle({});
  }, []);

  const handleMainClick = useCallback(() => {
    setShowModal(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowModal(false);
  }, []);

  const prevImage = () =>
    onChangeIndex(activeIndex === 0 ? allImages.length - 1 : activeIndex - 1);
  const nextImage = () => onChangeIndex((activeIndex + 1) % allImages.length);

  return (
    <div className="flex flex-col-reverse gap-2 flex-shrink-0 max-h-[665px] md:flex-row md:w-2/5 md:gap-4">
      <div className="flex flex-wrap md:flex-col gap-2 px-5 md:px-0 shrink-0">
        {allImages.map((src, idx) => {
          const isActive = idx === activeIndex;
          return (
            <div
              key={idx}
              className={`relative w-15 h-15 overflow-hidden border-2 cursor-pointer 
                ${
                  isActive
                    ? 'border-[rgba(0,0,0,0.15)]'
                    : 'border-transparent group'
                }`}
              onClick={() => onChangeIndex(idx)}
            >
              {isVideo(src) ? (
                <video
                  src={src}
                  muted
                  autoPlay
                  loop
                  playsInline
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
                    !isActive ? 'group-hover:opacity-70' : ''
                  }`}
                />
              ) : (
                <img
                  src={src}
                  alt="Preview"
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
                    !isActive ? 'group-hover:opacity-70' : ''
                  }`}
                />
              )}

              {soldOut && idx === activeIndex && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 transition-opacity duration-300">
                  <span className="text-[11px] text-white font-bold uppercase">
                    SOLD OUT
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div
        ref={zoomRef}
        onClick={handleMainClick}
        className="flex-1 aspect-[3/4] relative overflow-hidden"
      >
        <div
          className="flex transition-transform duration-500 ease-in-out h-full"
          style={{
            width: `${allImages.length * 100}%`,
            transform: `translateX(-${
              activeIndex * (100 / allImages.length)
            }%)`,
          }}
        >
          {allImages.map((src, idx) => (
            <div
              key={idx}
              className="h-full flex-shrink-0 relative"
              style={{ width: `${100 / allImages.length}%` }}
            >
              {isVideo(src) ? (
                <video
                  src={src}
                  muted
                  autoPlay
                  loop
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover"
                  onClick={handleMainClick}
                />
              ) : (
                <img
                  src={src}
                  alt="Product"
                  className="absolute inset-0 w-full h-full object-cover"
                  onMouseMove={
                    isHoverable && idx === activeIndex ? handleMouseMove : null
                  }
                  onMouseLeave={
                    isHoverable && idx === activeIndex ? handleMouseLeave : null
                  }
                  style={zoom && idx === activeIndex ? zoomStyle : {}}
                />
              )}

              {soldOut && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 transition-opacity duration-300 group-hover:opacity-0">
                  <span className="sold-out-text">SOLD OUT</span>
                </div>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onChangeIndex(
              activeIndex === 0 ? allImages.length - 1 : activeIndex - 1
            );
          }}
          className="absolute flex justify-center min-h-12 min-w-12 items-center left-0 md:left-2 top-1/2 -translate-y-1/2 z-10 p-1 cursor-pointer"
          aria-label="Previous image"
        >
          <svg
            viewBox="0 0 13.3 25"
            xmlns="http://www.w3.org/2000/svg"
            className="rotate-180 w-[11px] h-[23px] md:w-[13px] md:h-[25px]"
          >
            <polyline
              fill="none"
              stroke="#000000"
              strokeLinejoin="butt"
              strokeLinecap="butt"
              strokeWidth="1"
              points="0.5,0.5 12.5,12.5 0.5,24.5"
            />
          </svg>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onChangeIndex((activeIndex + 1) % allImages.length);
          }}
          className="absolute flex justify-center min-h-12 min-w-12 items-center right-0 md:right-2 top-1/2 -translate-y-1/2 z-10 p-1 cursor-pointer"
          aria-label="Next image"
        >
          <svg
            viewBox="0 0 13.3 25"
            xmlns="http://www.w3.org/2000/svg"
            className="w-[11px] h-[23px] md:w-[13px] md:h-[25px]"
          >
            <polyline
              fill="none"
              stroke="#000000"
              strokeLinejoin="butt"
              strokeLinecap="butt"
              strokeWidth="1"
              points="0.5,0.5 12.5,12.5 0.5,24.5"
            />
          </svg>
        </button>
      </div>

      <ImageModal
        isOpen={showModal}
        images={allImages}
        activeIndex={activeIndex}
        onClose={handleCloseModal}
        onPrev={prevImage}
        onNext={nextImage}
      />
    </div>
  );
};

export const ImageGallery = memo(ImageGalleryComponents);
