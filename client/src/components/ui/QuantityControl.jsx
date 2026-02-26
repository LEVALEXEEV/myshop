import { memo } from 'react';
import minusIcon from '../../assets/minus.svg';
import plusIcon from '../../assets/plus.svg';

const QuantityControlComponent = ({
  value,
  onDecrement,
  onIncrement,
  onChange,
  onBlur,
  error = false,
}) => (
  <div className="flex items-center gap-2">
    <button
      type="button"
      onClick={onDecrement}
      aria-label="Уменьшить количество"
      className="min-w-4 opacity-50 hover:opacity-100 transition-all duration-200"
    >
      <img src={minusIcon} alt="–" className="w-4 h-4" />
    </button>
    <input
      type="number"
      step="1"
      min="1"
      max="9999"
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      aria-live="polite"
      className={`text-center font-light leading-[16px] outline-none ${
        error ? 'animate-error' : ''
      }`}
      style={{ width: `${Math.max(value.length, 1) + 1.5}ch` }}
    />
    <button
      type="button"
      onClick={onIncrement}
      aria-label="Увеличить количество"
      className="min-w-4 opacity-50 hover:opacity-100 transition-all duration-200"
    >
      <img src={plusIcon} alt="+" className="w-4 h-4" />
    </button>
  </div>
);

export const QuantityControl = memo(QuantityControlComponent);

QuantityControl.displayName = 'QuantityControl';
