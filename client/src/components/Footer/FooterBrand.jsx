import React from 'react';

export const FooterBrand = React.memo(({ onScrollToTop }) => (
  <div
    className="
      flex flex-col items-center
      md:items-start md:flex-row
      mt-12 md:justify-between md:footer-bottom
      text-white
      gap-3 md:gap-4
      text-center md:text-left md:flex-wrap
    "
  >
    <div className="flex flex-col items-center md:items-start gap-3 md:max-w-[60%]">
      <div
        onClick={onScrollToTop}
        className="
          mb-8 md:mb-2 font-roboto
          max-w-[360px] md:max-w-[60%]
          text-xs md:responsive-bottom
          cursor-pointer
          text-[#848484] md:text-white
          leading-snug
        "
      >
        <strong className="text-white">Resego™</strong> — бренд объединяющий спорт и уличный стиль через одежду и делает это главным принципом в создании своих коллекций.
      </div>
      <span
        onClick={onScrollToTop}
        className="
          text-[#5f5f5f]
          text-xs
          md:responsive-heading
          cursor-pointer
        "
      >
        2023–2025 ©Resego. Все права защищены.
      </span>
    </div>

    <div className="text-[#5f5f5f] text-xs md:responsive-heading md:self-end">
      * продукт компании Meta, запрещенной в РФ
    </div>
  </div>
));
