import { memo } from 'react';

const ColorSelector = ({
  colorStock,
  selectedColor,
  onSelectColor,
  disabled,
}) => {
  if (!Array.isArray(colorStock) || colorStock.length === 0) return null;

  return (
    <div>
      <div className="text-xs md:text-sm font-light mb-2 uppercase">
        ЦВЕТ{selectedColor ? `: ${selectedColor.toLowerCase()}` : ''}
      </div>
      <div className="flex gap-2 flex-wrap">
        {colorStock.map(({ color: name, color_hex: hex, qty }) => {
          const isSelected = name === selectedColor;
          const isOut = (qty ?? 0) === 0;
          return (
            <button
              key={name}
              type="button"
              title={name}
              aria-label={name}
              onClick={() => {
                if (!disabled && !isOut) onSelectColor(name);
              }}
              disabled={disabled || isOut}
              className={`
                relative w-8 h-8 rounded-full
                transition-all duration-200
                ${
                  isOut
                    ? 'opacity-40 cursor-not-allowed'
                    : isSelected
                    ? 'ring-2 ring-offset-2 ring-[#777] cursor-pointer'
                    : 'ring-1 ring-[rgba(0,0,0,0.15)] hover:ring-[#777] cursor-pointer'
                }
              `}
              style={{ backgroundColor: hex }}
            >
              {isOut && (
                <span
                  className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white pointer-events-none"
                  style={{ textShadow: '0 0 2px rgba(0,0,0,0.7)' }}
                >
                  ×
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default memo(ColorSelector);
