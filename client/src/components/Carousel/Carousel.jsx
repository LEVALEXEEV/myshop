import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function Carousel() {
  const [slides, setSlides] = useState([]);
  const [current, setCurrent] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    axios
      .get('/api/carousel')
      .then((res) => setSlides(res.data))
      .catch(console.error);
  }, []);

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 768px)');
    const handler = () => setIsMobile(mql.matches);
    mql.addEventListener('change', handler);
    handler();
    return () => mql.removeEventListener('change', handler);
  }, []);

  if (!slides.length) return null;

  const displaySlides = isMobile
    ? slides.filter((s) => s.mobile !== s.desktop)
    : slides;

  if (!displaySlides.length) return null;

  const prev = () =>
    setCurrent((i) => (i === 0 ? displaySlides.length - 1 : i - 1));
  const next = () =>
    setCurrent((i) => (i === displaySlides.length - 1 ? 0 : i + 1));

  return (
    <div className="relative w-full max-w-[1400px] mx-auto overflow-hidden">
      <div
        className="flex transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {displaySlides.map(({ desktop, mobile }, idx) => {
          const src = isMobile ? mobile : desktop;
          return (
            <div
              key={idx}
              className="flex-shrink-0 w-full relative overflow-hidden"
              style={{
                height: 'clamp(200px, 145vw, 800px)',
              }}
            >
              <img
                src={src}
                alt={`Слайд ${idx + 1}`}
                className="w-full h-full object-cover object-center"
                loading="lazy"
              />
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={prev}
        aria-label="Предыдущий слайд"
        className="
          absolute left-1 md:left-4 top-1/2 -translate-y-1/2 z-20
          p-2 rounded-full bg-black/30 hover:bg-black/50
          transition-colors duration-200 focus:outline-none
        "
      >
        <svg
          className="w-10 h-10 md:w-12 md:h-12 text-white rotate-180"
          viewBox="0 0 94 94"
          fill="none"
          stroke="currentColor"
          strokeWidth={1}
        >
          <path d="M39 68L60 47L39 26" />
        </svg>
      </button>

      <button
        type="button"
        onClick={next}
        aria-label="Следующий слайд"
        className="
          absolute right-1 md:right-4 top-1/2 -translate-y-1/2 z-20
          p-2 rounded-full bg-black/30 hover:bg-black/50
          transition-colors duration-200 focus:outline-none
        "
      >
        <svg
          className="w-10 h-10 md:w-12 md:h-12 text-white"
          viewBox="0 0 94 94"
          fill="none"
          stroke="currentColor"
          strokeWidth={1}
        >
          <path d="M39 68L60 47L39 26" />
        </svg>
      </button>
    </div>
  );
}
