import { memo } from 'react';

const RelatedProducts = ({ items, show, onSelect, wrapperRef }) => (
  <div ref={wrapperRef} className="px-5 md:px-0">
    <h3 className="uppercase mb-2 md:mb-6 text-[13px] md:text-sm tracking-widest font-light">
      СМОТРИТЕ ТАКЖЕ
    </h3>
    <div
      className={`flex gap-4 overflow-x-auto pb-2 -mx-1
                  md:grid md:grid-cols-2 md:gap-4 md:overflow-visible md:pb-0 md:mx-0
                  lg:grid-cols-4`}
    >
      {items.map((p, i) => (
        <div
          key={p.id}
          className={`relative group cursor-pointer font-light 
                      opacity-0 flex-shrink-0 max-w-[280px] md:flex-shrink md:max-w-none
                      ${show ? 'animate-fadeInLeft' : ''}`}
          style={{ animationDelay: `${i * 100}ms` }}
          onClick={() => onSelect(p)}
        >
          <div
            className="relative w-full overflow-hidden min-w-[280px] max-w-[280px] aspect-[9/10]
                       mb-4 md:aspect-[3/4] md:mb-3 md:min-w-auto md:max-w-none"
          >
            <img
              src={p.image}
              alt={p.title}
              className={`w-full h-full object-cover transition-opacity duration-300
                          ${p.image_hover ? 'group-hover:opacity-0' : ''}`}
            />
            {p.image_hover && (
              <img
                src={p.image_hover}
                alt={`${p.title} hover`}
                className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              />
            )}
            {p.sold_out && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 transition-opacity duration-300 group-hover:opacity-0">
                <span className="sold-out-text-mini">SOLD OUT</span>
              </div>
            )}
          </div>
          <div className="text-sm md:text-base uppercase truncate">
            {p.title}
          </div>
          <div className="text-sm md:text-base mt-1">
            {Number(p.price).toLocaleString()} р.
          </div>
          {p.sold_out && (
            <p className="text-sm text-[#f95d51] mt-1">Нет в наличии</p>
          )}
        </div>
      ))}
    </div>
  </div>
);

export default memo(RelatedProducts);
