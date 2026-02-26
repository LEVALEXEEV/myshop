import { useKeenSlider } from 'keen-slider/react';
import 'keen-slider/keen-slider.min.css';
import { useEffect, useRef, useState, useCallback } from 'react';
import axios from 'axios';

const SLIDER_OPTIONS = {
  loop: true,
  mode: 'snap',
  renderMode: 'performance',
  drag: true,
  slides: {
    perView: 4,
    spacing: 20,
  },
  breakpoints: {
    '(max-width: 768px)': {
      slides: {
        perView: 2,
        spacing: 15,
      },
    },
  },
};

export default function SupportersCarousel() {
  const sliderRef = useRef(null);
  const [images, setImages] = useState([]);
  const [sliderInstanceRef, slider] = useKeenSlider(SLIDER_OPTIONS);

  useEffect(() => {
    axios
      .get('/api/supporters')
      .then((res) => setImages(res.data))
      .catch((err) => console.error('Ошибка загрузки supporters:', err));
  }, []);

  const autoplay = useCallback(() => {
    slider?.current?.next();
  }, [slider]);

  useEffect(() => {
    if (!slider) return;
    const interval = setInterval(autoplay, 5000);
    return () => clearInterval(interval);
  }, [slider, autoplay]);

  return (
    <section className="w-full bg-[#252324] supporters-carousel-wrapper pt-6 pb-12 md:pt-12 md:pb-12 overflow-hidden">
      <div className="flex flex-col md:flex-row justify-between gap-6 md:gap-0 md:mx-4 font-arial">
        <h2 className="font-bold text-[14.5px] md:heading-h2-sm uppercase text-[#818181]">
          Люди, которые поддерживают наш бренд
        </h2>
        <p
          className="
            uppercase text-white font-semibold tracking-[-0.5px] text-base leading-[22px] max-w-[90%] self-start
            md:text-right md:self-end md:text-navbar md:paragraph-small md:leading-normal md:w-[60%] md:max-w-none
          "
        >
          Мы помогаем людям становиться носителем добрых эмоций и показывать
          окружающим своё внутреннее состояние через одежду Resego.
        </p>
      </div>

      <div
        ref={(ref) => {
          sliderRef.current = ref;
          sliderInstanceRef(ref);
        }}
        className="keen-slider supporters-carousel"
      >
        {images.map((img, idx) => (
          <div
            key={idx}
            className="keen-slider__slide flex-shrink-0"
            style={{
              borderRadius: '0.75rem',
              overflow: 'hidden',
              background: 'white',
            }}
          >
            <img
              src={img}
              alt={`supporter-${idx}`}
              className="w-full h-full object-cover pointer-events-none select-none"
              draggable={false}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
