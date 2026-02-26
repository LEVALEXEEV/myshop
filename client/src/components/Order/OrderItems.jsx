import { useEffect, useState, useCallback, useRef, memo } from 'react';
import removeItemIcon from '../../assets/remove-item.svg';
import { QuantityControl } from '../ui/QuantityControl';
import axios from 'axios';

const SHIPPING_FEE = 449;

function OrderItemsComponent({
  cart,
  updateQuantity,
  removeFromCart,
  discount,
}) {
  const [localQty, setLocalQty] = useState({});
  const [stockMap, setStockMap] = useState({});
  const [errorMap, setErrorMap] = useState({});
  const errorTimers = useRef({});

  useEffect(() => {
    const qtys = {};
    cart.forEach((item) => {
      const key = `${item.id}-${item.selectedSize}`;
      qtys[key] = String(item.quantity);
    });
    setLocalQty(qtys);
  }, [cart]);

  useEffect(() => {
    cart.forEach((item) => {
      const key = `${item.id}-${item.selectedSize}`;
      axios
        .get(`/api/products/${item.id}`)
        .then(({ data }) => {
          const entry = data.stock.find((s) => s.size === item.selectedSize);
          setStockMap((m) => ({ ...m, [key]: entry?.qty ?? 0 }));
        })
        .catch(() => {
          setStockMap((m) => ({ ...m, [key]: 0 }));
        });
    });
  }, [cart]);

  const total = cart.reduce((sum, p) => sum + p.price * p.quantity, 0);
  const goodsTotal =
    discount > 0 ? Math.round((total * (100 - discount)) / 100) : total;
  const grandTotal = goodsTotal + SHIPPING_FEE;

  const makeHandlers = useCallback(
    (item) => {
      const key = `${item.id}-${item.selectedSize}`;
      const available = stockMap[key] ?? 0;

      const triggerError = () => {
        setErrorMap((m) => ({ ...m, [key]: true }));
        clearTimeout(errorTimers.current[key]);
        errorTimers.current[key] = setTimeout(() => {
          setErrorMap((m) => ({ ...m, [key]: false }));
        }, 500);
      };

      const changeQty = (desired) => {
        let q = Math.max(1, desired);
        if (q > available) {
          q = available;
          triggerError();
        }
        updateQuantity({
          id: item.id,
          selectedSize: item.selectedSize,
          quantity: q,
        });
        setLocalQty((prev) => ({ ...prev, [key]: String(q) }));
      };

      return {
        onDecrement: () => {
          changeQty(item.quantity - 1);
        },
        onIncrement: () => {
          changeQty(item.quantity + 1);
        },
        onChange: (e) => {
          let raw = e.target.value;
          if (raw === '') {
            setLocalQty((prev) => ({ ...prev, [key]: '' }));
            return;
          }
          if (raw.length > 4) raw = raw.slice(0, 4);
          if (/^\d+$/.test(raw)) {
            setLocalQty((prev) => ({ ...prev, [key]: raw }));
            const num = parseInt(raw, 10);
            if (num >= 1) {
              changeQty(num);
            }
          }
        },
        onBlur: (e) => {
          const num = parseInt(e.target.value, 10) || 1;
          changeQty(num);
        },
        onRemove: () => {
          removeFromCart({ id: item.id, selectedSize: item.selectedSize });
        },
      };
    },
    [updateQuantity, removeFromCart, stockMap]
  );

  return (
    <div className="md:inline md:float-left md:mx-5 md:w-full md:max-w-[560px] gap-6">
      {cart.map((item) => {
        const key = `${item.id}-${item.selectedSize}`;
        const value = localQty[key] ?? String(item.quantity);
        const error = errorMap[key] || false;
        const { onDecrement, onIncrement, onChange, onBlur, onRemove } =
          makeHandlers(item);

        return (
          <div
            key={key}
            className="py-0 md:py-2.5 gap-2 md:gap-0 my-[35px] md:my-0 md:mb-5 mx-4 md:mx-0 flex items-start md:items-center justify-between"
          >
            <div className="flex gap-5 md:gap-0 md:items-center">
              <div className="relative w-17.5 h-17.5 md:mr-5 flex-shrink-0">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col justify-start md:block md:max-w-48 text-black">
                <div className="text-base leading-[1.55] font-bold">
                  {item.title}
                </div>
                <div className="text-xs font-normal leading-[1.55] opacity-[0.7] mb-2 md:mb-0">
                  РАЗМЕР: {item.selectedSize.toLowerCase()}
                </div>
                <div className="flex md:hidden flex-row items-center gap-3">
                  <QuantityControl
                    value={value}
                    onDecrement={onDecrement}
                    onIncrement={onIncrement}
                    onChange={onChange}
                    onBlur={onBlur}
                    error={error}
                  />
                  <div className="font-light min-w-[80px]">
                    {(item.price * item.quantity).toLocaleString()} р.
                  </div>
                </div>
              </div>
            </div>

            <div className="flex md:hidden items-start min-w-5">
              <button
                onClick={onRemove}
                className="cursor-pointer opacity-[0.4] hover:opacity-100 transition-all duration-200"
              >
                <img src={removeItemIcon} alt="Удалить" className="w-5 h-5" />
              </button>
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
              <div className="min-w-[80px] max-w-[110px] text-center">
                {(item.price * item.quantity).toLocaleString()} р.
              </div>
              <button
                onClick={onRemove}
                className="cursor-pointer opacity-[0.4] min-w-5 hover:opacity-100 transition-all duration-200"
              >
                <img src={removeItemIcon} alt="Удалить" className="w-5 h-5" />
              </button>
            </div>
          </div>
        );
      })}

      <div
        className="pt-3 pb-8 md:pb-[50px] px-4 md:px-0 border-t border-[rgba(0,0,0,0.1)] 
          md:border-0 text-right font-semibold md:sticky md:bottom-0 md:bg-white md:pt-4"
      >
        {discount > 0 ? (
          <>
            <div className="line-through opacity-50">
              {total.toLocaleString()} р.
            </div>
            <div>
              Сумма: {goodsTotal.toLocaleString()} р. (+ доставка{' '}
              {SHIPPING_FEE.toLocaleString()} р.)
            </div>
          </>
        ) : (
          <div>
            Сумма: {total.toLocaleString()} р. (+ доставка{' '}
            {SHIPPING_FEE.toLocaleString()} р.)
          </div>
        )}
        <div>
          <strong>Итого: {grandTotal.toLocaleString()} р.</strong>
        </div>
      </div>
    </div>
  );
}

export const OrderItems = memo(OrderItemsComponent);
