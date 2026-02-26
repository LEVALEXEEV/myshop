import { memo, useState, useRef } from 'react';

const QuantityPickerComponent = ({
  quantity,
  maxQuantity = Infinity,
  onDecrement,
  onIncrement,
  onChange,
}) => {
  const [isErrorAnim, setErrorAnim] = useState(false);
  const errorTimeout = useRef(null);

  const triggerErrorAnim = () => {
    if (errorTimeout.current) clearTimeout(errorTimeout.current);
    setErrorAnim(true);
    errorTimeout.current = setTimeout(() => {
      setErrorAnim(false);
    }, 500);
  };

  const handleInputChange = (raw) => {
    if (raw === '') {
      onChange('');
      return;
    }
    let digits = raw.replace(/\D/g, '');
    if (+digits > maxQuantity) {
      digits = String(maxQuantity);
      triggerErrorAnim();
    }
    if (digits.length > 4) digits = digits.slice(0, 4);
    onChange(digits);
  };

  const handleBlur = () => {
    let n = Number(quantity) || 1;
    if (n < 1) n = 1;
    if (n > maxQuantity) {
      n = maxQuantity;
      triggerErrorAnim();
    }
    onChange(String(n));
  };

  const handlePlus = () => {
    const n = Number(quantity) || 0;
    if (n < maxQuantity) {
      onIncrement();
    } else {
      triggerErrorAnim();
    }
  };

  return (
    <div
      className="flex items-center h-[50px] md:h-[45px] border border-[#777] rounded-sm px-1.5 py-1 text-sm select-none gap-1"
      role="group"
      aria-label="Выбор количества"
    >
      <button
        type="button"
        onClick={onDecrement}
        aria-label="Уменьшить количество"
        className="w-6 h-6 rounded-full bg-white bg-[linear-gradient(#777,#777)] bg-no-repeat bg-center bg-[length:50%_1px] cursor-pointer"
      />

      <input
        type="text"
        inputMode="numeric"
        pattern="\d*"
        value={quantity}
        onChange={(e) => handleInputChange(e.target.value)}
        onBlur={handleBlur}
        aria-live="polite"
        className={`${
          isErrorAnim ? 'animate-error' : ''
        } w-8 text-center font-light bg-transparent outline-none border-none px-0 leading-none transition-transform`}
      />

      <button
        type="button"
        onClick={handlePlus}
        aria-label="Увеличить количество"
        className="w-6 h-6 rounded-full bg-white bg-[linear-gradient(#777,#777),linear-gradient(#777,#777)] bg-no-repeat bg-center bg-[length:50%_1px,1px_45%] cursor-pointer"
      />
    </div>
  );
};

export const QuantityPicker = memo(QuantityPickerComponent);
QuantityPicker.displayName = 'QuantityPicker';
