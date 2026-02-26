import React from 'react';
import removeItem from '../../assets/remove-item.svg';
import { QuantityControl } from '../ui/QuantityControl';

export const CartItem = React.memo(
  ({
    item,
    value,
    onDecrement,
    onIncrement,
    onChange,
    onBlur,
    onRemove,
    error,
  }) => {
    const price = (item.price * item.quantity).toLocaleString();

    return (
      <div className="relative py-2.5 px-4 md:px-0 mb-5 gap-2 md:gap-0 flex items-start md:items-center justify-between">
        <div className="flex gap-5 md:gap-0 items-start md:items-center">
          <div className="md:relative w-17.5 h-17.5 md:mr-5 flex-shrink-0">
            <img
              src={item.image}
              alt={item.title}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex md:block flex-col justify-start md:max-w-32 text-black">
            <a
              href={`/product/${item.id}?size=${item.selectedSize}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-base leading-[1.55] font-bold"
            >
              {item.title}
            </a>
            <div className="text-xs font-normal leading-[1.55] opacity-[0.7] mb-[10px] md:mb-0">
              РАЗМЕР: {item.selectedSize.toLowerCase()}
            </div>

            <div className="flex md:hidden items-center gap-4">
              <QuantityControl
                value={value}
                onDecrement={onDecrement}
                onIncrement={onIncrement}
                onChange={onChange}
                onBlur={onBlur}
                error={error}
              />
              <div className="font-light">{price} р.</div>
            </div>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-4">
          <QuantityControl
            value={value}
            onDecrement={onDecrement}
            onIncrement={onIncrement}
            onChange={onChange}
            onBlur={onBlur}
            error={error}
          />
          <div className="min-w-[80px] max-w-[110px] text-center font-light">
            {price} р.
          </div>
          <button
            onClick={onRemove}
            className="cursor-pointer opacity-40 hover:opacity-100 transition-all duration-200"
          >
            <img src={removeItem} alt="Удалить" className="w-5 h-5" />
          </button>
        </div>

        <button
          onClick={onRemove}
          className="flex md:hidden min-w-5 opacity-40 hover:opacity-100 transition-all duration-200"
        >
          <img src={removeItem} alt="Удалить" className="w-5 h-5" />
        </button>
      </div>
    );
  }
);
