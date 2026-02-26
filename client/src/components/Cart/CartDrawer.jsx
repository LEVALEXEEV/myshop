import { useState, useEffect, useRef } from 'react';
import { useCart } from '../../context/CartContext';
import OrderModal from '../Order/OrderModal';
import { useLocalQty } from '../../hooks/useLocalQty';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { CartItem } from './CartItem';
import axios from 'axios';
import Toast from '../ui/Toast';

const CartDrawer = () => {
  const { cart, removeFromCart, updateQuantity, isCartOpen, closeCart } =
    useCart();
  const [showOrder, setShowOrder] = useState(false);

  const [localQty, setLocalQty] = useLocalQty(cart);
  useBodyScrollLock(isCartOpen);

  const [stockMap, setStockMap] = useState({});
  const [toast, setToast] = useState({
    show: false,
    msg: '',
    variant: 'error',
  });
  const [errorMap, setErrorMap] = useState({});
  const errorTimers = useRef({});

  useEffect(() => {
    cart.forEach((item) => {
      const key = `${item.id}-${item.selectedSize}`;
      axios
        .get(`/api/products/${item.id}`)
        .then(({ data }) => {
          const entry = data.stock.find((s) => s.size === item.selectedSize);
          setStockMap((prev) => ({
            ...prev,
            [key]: entry?.qty ?? 0,
          }));
        })
        .catch(() => {
          setStockMap((prev) => ({ ...prev, [key]: 0 }));
        });
    });
  }, [cart]);

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <>
      {toast.show && (
        <Toast
          message={toast.msg}
          variant={toast.variant}
          onClose={() => setToast((t) => ({ ...t, show: false }))}
        />
      )}
      <div
        className={`fixed inset-0 z-[100] transition-opacity duration-300 ${
          isCartOpen
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="absolute inset-0 bg-black/10" onClick={closeCart} />

        <div
          className={`absolute right-0 top-0 h-full w-full pb-4 md:pb-10 md:pt-10 md:px-10 max-w-[560px]
                    bg-white shadow-[0_0_10px_rgba(0,0,0,0.2)]
                    transform transition-transform duration-300 overflow-y-auto ${
                      isCartOpen ? 'translate-x-0' : 'translate-x-full'
                    }`}
        >
          <div
            className="sticky top-0 z-10 bg-white flex justify-between items-center
                  w-full border-b border-[rgba(0,0,0,0.2)]
                  pb-4 pt-4 md:pt-0 md:pb-5 mb-5
                  md:static md:bg-transparent"
          >
            <h2 className="text-lg md:text-2xl font-semibold pl-4 md:pl-0">
              Оформление заказа
            </h2>
            <button
              onClick={closeCart}
              aria-label="Закрыть"
              className="cursor-pointer"
            >
              <svg
                viewBox="0 0 23 23"
                className="mr-4 md:mr-0 w-[18px] h-[18px] md:w-[23px] md:h-[23px]"
              >
                <g fill="#000">
                  <rect
                    transform="rotate(-45 11.3 11.3)"
                    x="10.3"
                    y="-3.6"
                    width="2"
                    height="30"
                  />
                  <rect
                    transform="rotate(-315 11.3 11.3)"
                    x="10.3"
                    y="-3.6"
                    width="2"
                    height="30"
                  />
                </g>
              </svg>
            </button>
          </div>

          {cart.length > 0 ? (
            <>
              {cart.map((item) => {
                const key = `${item.id}-${item.selectedSize}`;
                const available = stockMap[key] ?? 0;
                const value = localQty[key] ?? String(item.quantity);

                const triggerError = (key) => {
                  setErrorMap((m) => ({ ...m, [key]: true }));
                  clearTimeout(errorTimers.current[key]);
                  errorTimers.current[key] = setTimeout(() => {
                    setErrorMap((m) => ({ ...m, [key]: false }));
                  }, 500);
                };

                const changeQty = (desired) => {
                  let qty = Math.max(1, desired);
                  if (qty > available) {
                    qty = available;
                    setToast({
                      show: true,
                      variant: 'error',
                      msg: 'В вашей корзине уже максимум данного товара',
                    });
                    triggerError(key);
                  }
                  updateQuantity({
                    id: item.id,
                    selectedSize: item.selectedSize,
                    quantity: qty,
                  });
                  setLocalQty((prev) => ({ ...prev, [key]: String(qty) }));
                };

                const onDecrement = () => changeQty(item.quantity - 1);
                const onIncrement = () => changeQty(item.quantity + 1);

                const onChange = (e) => {
                  const raw = e.target.value;
                  if (raw === '' || (/^\d+$/.test(raw) && raw.length <= 4)) {
                    setLocalQty((prev) => ({ ...prev, [key]: raw }));
                  }
                };

                const onBlur = () => {
                  const num = parseInt(localQty[key], 10) || 1;
                  changeQty(num);
                };

                const onRemove = () => {
                  removeFromCart({
                    id: item.id,
                    selectedSize: item.selectedSize,
                  });
                };

                return (
                  <CartItem
                    key={key}
                    item={item}
                    value={value}
                    onDecrement={onDecrement}
                    onIncrement={onIncrement}
                    onChange={onChange}
                    onBlur={onBlur}
                    onRemove={onRemove}
                    error={errorMap[key]}
                  />
                );
              })}

              <div className="border-t border-[rgba(0,0,0,0.2)] pt-3 px-4 md:px-0 pb-[50px] text-right font-semibold">
                Сумма: {total.toLocaleString()} р.
              </div>

              <div className="mx-5 md:mx-0">
                <button
                  onClick={() => {
                    closeCart();
                    setTimeout(() => setShowOrder(true), 300);
                  }}
                  className="w-full bg-black text-white uppercase font-bold h-[60px] hover:bg-[#333] transition-all duration-200"
                >
                  Оформить заказ
                </button>
              </div>
            </>
          ) : (
            <div className="text-sm mx-4 md:mx-0 text-gray-500">
              В вашей корзине пока нет товаров.
            </div>
          )}
        </div>
      </div>

      <OrderModal visible={showOrder} onClose={() => setShowOrder(false)} />
    </>
  );
};

export default CartDrawer;
