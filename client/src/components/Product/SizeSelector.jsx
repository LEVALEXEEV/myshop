import { memo } from 'react';

const SizeSelector = ({
  sortedSizes,
  selectedSize,
  onSelectSize,
  disabled,
}) => {
  if (sortedSizes.length === 0) return null;

  return (
    <div>
      <div className="text-xs md:text-sm font-light mb-1 uppercase">РАЗМЕР</div>
      <div className="flex gap-2">
        {sortedSizes.map(({ size, qty }) => {
          const isSelected = size === selectedSize;
          const isOut = qty === 0;
          return (
            <button
              key={size}
              onClick={() => {
                if (!disabled && !isOut) onSelectSize(size);
              }}
              disabled={disabled || isOut}
              className={`
                w-7.5 h-8 text-xs md:text-sm font-light
                flex items-center justify-center
                transition-colors duration-200
                ${
                  isOut
                    ? 'text-gray-400 border-[rgba(0,0,0,0.1)] pointer-events-none select-none'
                    : isSelected
                    ? 'border-[#777] border cursor-pointer'
                    : 'border-[rgba(0,0,0,0.15)] hover:border-[#777] hover:border cursor-pointer'
                }
              `}
              style={{ borderWidth: '1px' }}
            >
              {size}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default memo(SizeSelector);
