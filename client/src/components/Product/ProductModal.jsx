import { useRef, useEffect, useState, useMemo, useCallback, memo } from 'react';
import { useFavorites } from '../../context/FavoritesContext';
import { useCart } from '../../context/CartContext';
import { ImageGallery } from './ImageGallery';
import { AccordionGroup, Accordion } from './Accordion';
import SizeSelector from './SizeSelector';
import { QuantityPicker } from './QuantityPicker';
import FavoriteButton from './FavoriteButton';
import RelatedProducts from './RelatedProducts';
import Toast from '../ui/Toast';
import axios from 'axios';
import { useModal } from '../../context/ModalContext';

const ProductModal = ({
  product,
  onClose,
  relatedProducts,
  onSelectProduct,
  hideCloseButton = false,
  showCartIcon = false,
  initialSize = null,
  closeOnAddToCart = true,
}) => {
  const [isClosing, setIsClosing] = useState(false);
  const [selectedSize, setSelectedSize] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeIndex, setActiveIndex] = useState(0);
  const [showRelated, setShowRelated] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastVariant, setToastVariant] = useState('default');
  const [showToast, setShowToast] = useState(false);
  const { open, close } = useModal();

  const containerRef = useRef(null);
  const relatedRef = useRef(null);
  const { isFavorite, toggleFavorite } = useFavorites();
  const { cart, addToCart, updateQuantity, openCart } = useCart();

  const allImages = useMemo(
    () => [
      product.image,
      ...(product.image_hover ? [product.image_hover] : []),
      ...(product.extra_images || []),
    ],
    [product.image, product.image_hover, product.extra_images]
  );

  const sortedSizes = useMemo(() => {
    if (!product.stock || product.stock.length === 0) return [];
    const order = ['xs', 's', 'm', 'l', 'xl', 'xxl', 'xxxl'];
    return product.stock
      .map(({ size, qty }) => ({ size, qty }))
      .sort((a, b) => {
        const ia = order.indexOf(a.size);
        const ib = order.indexOf(b.size);
        if (ia === -1 && ib === -1) return 0;
        if (ia === -1) return 1;
        if (ib === -1) return -1;
        return ia - ib;
      });
  }, [product.stock]);

  useEffect(() => {
    open();
    return () => close();
  }, [open, close]);

  useEffect(() => {
    setActiveIndex(0);

    const availSizes = sortedSizes
      .filter(({ qty }) => qty > 0)
      .map(({ size }) => size);
    if (availSizes.length > 0) {
      if (initialSize && availSizes.includes(initialSize)) {
        setSelectedSize(initialSize);
      } else {
        setSelectedSize(availSizes[0]);
      }
    } else {
      setSelectedSize(null);
    }

    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [product, initialSize, sortedSizes]);

  const handleSelectSize = useCallback((size) => setSelectedSize(size), []);

  const handleDecrement = useCallback(() => {
    setQuantity((q) => {
      const n = parseInt(q) || 1;
      return String(Math.max(1, n - 1));
    });
  }, []);

  const handleIncrement = useCallback(() => {
    setQuantity((q) => {
      const n = parseInt(q) || 1;
      return String(n + 1);
    });
  }, []);

  const handleQuantityChange = useCallback((newVal) => {
    setQuantity(newVal);
  }, []);

  const handleToggleFavorite = useCallback(() => {
    const sizeToAdd = selectedSize || 's';

    const wasFav = isFavorite({
      id: product.id,
      selectedSize: sizeToAdd,
    });

    toggleFavorite({
      ...product,
      selectedSize: sizeToAdd,
    });

    if (!wasFav) {
      setToastVariant('default');
      setToastMsg(`${product.title} добавлен в избранное`);
      setShowToast(true);
    }
  }, [
    product,
    selectedSize,
    isFavorite,
    toggleFavorite,
    setToastMsg,
    setShowToast,
  ]);

  const handleSelectRelated = useCallback(
    (product) => {
      setShowRelated(false);
      if (containerRef.current) {
        containerRef.current.scrollTop = 0;
      }
      onSelectProduct(product);
    },
    [onSelectProduct]
  );

  const handleClose = useCallback(() => {
    setIsClosing(true);
    if (typeof onClose === 'function') {
      setTimeout(() => onClose(), 300);
    }
  }, [onClose]);

  const handleAddToCart = useCallback(async () => {
    if (!selectedSize) return;
    const qty = Math.max(1, parseInt(quantity, 10) || 1);

    try {
      const { data: fresh } = await axios.get(`/api/products/${product.id}`);
      const stockEntry = fresh.stock?.find((s) => s.size === selectedSize);
      const available = stockEntry?.qty ?? 0;

      const alreadyInCart =
        cart.find((p) => p.id === product.id && p.selectedSize === selectedSize)
          ?.quantity || 0;

      if (qty + alreadyInCart > available) {
        setToastVariant('error');
        setToastMsg('В вашей корзине уже максимум данного товара');
        setShowToast(true);
        return;
      }

      const existing = cart.find(
        (p) => p.id === product.id && p.selectedSize === selectedSize
      );
      if (existing) {
        const newTotal = existing.quantity + qty;
        if (newTotal > 9999) {
          setToastVariant('error');
          setToastMsg('Нельзя добавить больше 9999 единиц данного товара');
          setShowToast(true);
          return;
        }
        updateQuantity({
          id: product.id,
          selectedSize,
          quantity: newTotal,
        });
      } else {
        if (qty > 9999) {
          setToastVariant('error');
          setToastMsg('Нельзя добавить больше 9999 единиц данного товара');
          setShowToast(true);
          return;
        }
        addToCart({
          id: product.id,
          title: product.title,
          price: product.price,
          image: product.image,
          selectedSize,
          quantity: qty,
        });
      }

      setQuantity(1);

      if (typeof onClose === 'function') {
        if (closeOnAddToCart) {
          setIsClosing(true);
          setTimeout(() => {
            onClose();
            openCart();
          }, 300);
        } else {
          openCart();
        }
      } else {
        openCart();
      }
    } catch (err) {
      console.error('Не удалось проверить остаток:', err);
      setToastVariant('error');
      setToastMsg('Ошибка при проверке наличия');
      setShowToast(true);
    }
  }, [
    selectedSize,
    quantity,
    cart,
    product.id,
    product.title,
    product.price,
    product.image,
    updateQuantity,
    addToCart,
    onClose,
    openCart,
  ]);

  useEffect(() => {
    setShowRelated(false);
  }, [product.id]);

  useEffect(() => {
    if (!relatedRef.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShowRelated(true);
          obs.disconnect();
        }
      },
      { root: containerRef.current, threshold: 0.1 }
    );
    obs.observe(relatedRef.current);
    return () => obs.disconnect();
  }, [relatedProducts, showRelated]);

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-hidden flex flex-col">
      <div
        ref={containerRef}
        className={`
        flex-1 overflow-y-auto scroll-container
        transition-opacity duration-300
        ${isClosing ? 'scroll-fade-out' : 'scroll-fade-in'}
      `}
      >
        <div
          className={`
          transition-all duration-500
          ${
            isClosing
              ? 'animate-modalExit opacity-0'
              : 'animate-modalEnter opacity-100'
          }
        `}
        >
          <div
            className={`relative pb-24 md:pb-26 md:px-10 min-h-screen ${
              showCartIcon ? 'md:pt-12' : 'md:pt-26'
            }`}
          >
            {!hideCloseButton && (
              <button
                onClick={handleClose}
                aria-label="Закрыть"
                className={`sticky top-0 z-30 bg-white flex items-center w-full h-[50px] px-3 border-b border-[rgba(0,0,0,0.1)]
                  text-2xl cursor-pointer md:fixed md:top-5 md:right-5 md:z-50 md:w-auto md:h-auto md:px-0 md:border-0 md:bg-transparent
                `}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 26 26"
                  className="w-[26px] h-[26px]"
                >
                  <path
                    className="block md:hidden"
                    d="M10.4142136,5 L11.8284271,6.41421356 L5.829,12.414 L23.4142136,12.4142136 L23.4142136,14.4142136 L5.829,14.414 L11.8284271,20.4142136 L10.4142136,21.8284271 L2,13.4142136 L10.4142136,5 Z"
                    fill="#000000"
                  />

                  <g
                    className="hidden md:block"
                    fill="#000000"
                    fillRule="evenodd"
                  >
                    <rect
                      transform="translate(11.313708, 11.313708) rotate(-45) translate(-11.313708, -11.313708)"
                      x="10.3137085"
                      y="-3.6862915"
                      width="2"
                      height="30"
                    />
                    <rect
                      transform="translate(11.313708, 11.313708) rotate(-315) translate(-11.313708, -11.313708)"
                      x="10.3137085"
                      y="-3.6862915"
                      width="2"
                      height="30"
                    />
                  </g>
                </svg>
              </button>
            )}
            {showCartIcon && (
              <div
                className="sticky top-[100px] -mt-[60px] z-20 w-full px-5 flex justify-end 
                  md:sticky md:top-[90px] md:-mt-0 md:px-2.5"
              >
                <button
                  onClick={openCart}
                  aria-label="Открыть корзину"
                  className="
                    relative flex items-center justify-center w-[60px] h-[60px] rounded-full
                    bg-[hsla(0,0%,100%,.8)] shadow-[0_2px_3px_rgba(0,11,48,0.25)]
                    cursor-pointer transition-transform duration-200 hover:scale-105
                  "
                >
                  <svg
                    role="img"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 64 64"
                    stroke="currentColor"
                    fill="none"
                    strokeWidth="2"
                    strokeMiterlimit="10"
                    className="w-[34px] h-[34px]"
                  >
                    <path d="M44 18h10v45H10V18h10z" />
                    <path d="M22 24V11c0-5.523 4.477-10 10-10s10 4.477 10 10v13" />
                  </svg>

                  {cart.length > 0 && (
                    <span
                      className="
                        absolute bottom-[-6px] right-[-6px] flex items-center justify-center
                        w-6 h-6 bg-[#ff0000] text-white text-sm font-arial leading-none rounded-full
                      "
                    >
                      {cart.length}
                    </span>
                  )}
                </button>

                {cart.length > 0 && (
                  <div
                    className="
                      absolute right-[130%] top-1/2 -translate-y-1/2
                      bg-[#292929] text-white text-[15px] font-semibold font-['Roboto']
                      px-[13px] py-[9px] rounded-md whitespace-nowrap pointer-events-none
                      opacity-0 transition-opacity duration-300 group-hover:opacity-100
                      before:content-[''] before:absolute before:top-1/2 before:right-[-20px]
                      before:-translate-y-1/2 before:border-[10px] before:border-transparent
                      before:border-l-[#292929]
                    "
                  >
                    ={' '}
                    {cart
                      .reduce((sum, p) => sum + p.price * p.quantity, 0)
                      .toLocaleString()}
                    &nbsp;р.
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col md:flex-row sm:gap-8 sm:mb-20 gap-6 mb-10 md:gap-24 md:mb-50">
              <ImageGallery
                allImages={allImages}
                activeIndex={activeIndex}
                onChangeIndex={setActiveIndex}
                soldOut={product.sold_out}
              />

              <div className="flex flex-col px-5 md:px-0 gap-3 w-full md:max-w-[560px]">
                <div className="flex flex-row justify-between items-center">
                  <div className="text-xl md:text-2xl uppercase mb-1 font-arial">
                    {product.title}
                  </div>
                </div>
                <div className="text-base md:text-xl font-light">
                  {Number(product.price).toLocaleString()} р.
                </div>
                <SizeSelector
                  sortedSizes={sortedSizes}
                  selectedSize={selectedSize}
                  onSelectSize={handleSelectSize}
                  disabled={product.sold_out}
                />

                <div className="flex items-center gap-1 mt-4">
                  {!product.sold_out && (
                    <QuantityPicker
                      quantity={quantity}
                      maxQuantity={(() => {
                        const entry = product.stock.find(
                          (s) => s.size === selectedSize
                        );
                        return entry?.qty ?? 0;
                      })()}
                      onDecrement={handleDecrement}
                      onIncrement={handleIncrement}
                      onChange={handleQuantityChange}
                    />
                  )}

                  {product.sold_out ? (
                    <button
                      disabled
                      className="pointer-events-none w-full md:w-auto select-none bg-[rgba(0,0,0,0.5)] text-[rgba(255,255,255,0.6)] h-[50px] md:h-[45px] px-7.5 py-2 rounded-sm text-sm uppercase font-arial"
                    >
                      Нет в наличии
                    </button>
                  ) : (
                    <button
                      onClick={handleAddToCart}
                      className="cursor-pointer w-full md:w-auto select-none bg-black hover:bg-[#333] h-[50px] md:h-[45px] text-white px-7.5 py-2 rounded-sm text-sm transition-colors duration-300 font-arial"
                    >
                      В КОРЗИНУ
                    </button>
                  )}

                  <FavoriteButton
                    isFavorited={isFavorite({ id: product.id, selectedSize })}
                    onClick={handleToggleFavorite}
                    disabled={!selectedSize}
                  />
                </div>

                <div className="mt-8 md:mt-12 w-full max-w-[560px] mx-auto border-t border-black">
                  <AccordionGroup defaultOpenIndex={null}>
                    <Accordion index={0} title="Описание">
                      <div
                        className="pb-4 text-xs md:text-sm"
                        dangerouslySetInnerHTML={{
                          __html: product.description,
                        }}
                      />
                    </Accordion>

                    <Accordion index={1} title="Таблица размеров">
                      <div className="pb-4">
                        {product.size_chart ? (
                          <img
                            src={product.size_chart}
                            alt="Таблица размеров"
                            className="w-full object-contain"
                          />
                        ) : (
                          <div className="text-center text-gray-500 text-sm">
                            Таблица размеров недоступна
                          </div>
                        )}
                      </div>
                    </Accordion>

                    <Accordion index={2} title="Доставка и оплата">
                      <div className="pb-4 text-xs md:text-sm">
                        <div className="font-bold">СРОК ОТПРАВКИ:</div>
                        <div className="font-light">1-3 дня.</div>
                        <br />
                        <div className="font-bold">ДОСТАВКА:</div>
                        <div className="font-light">
                          Оплачивается отдельно при получении.
                        </div>
                        <br />
                        <div className="font-bold">ОПЛАТА</div>
                        <div className="font-light">
                          Оплата производиться банковской картой при оформлении
                          заказа. После оформления заказа с Вами свяжется
                          менеджер и уточнит детали доставки.
                        </div>
                      </div>
                    </Accordion>
                  </AccordionGroup>
                </div>
              </div>
            </div>
            {relatedProducts.length > 0 && (
              <RelatedProducts
                items={relatedProducts}
                show={showRelated}
                onSelect={handleSelectRelated}
                wrapperRef={relatedRef}
              />
            )}
          </div>
        </div>
      </div>
      {showToast && (
        <Toast
          message={toastMsg}
          variant={toastVariant}
          onClose={() => setShowToast(false)}
        />
      )}
    </div>
  );
};

export default memo(ProductModal);
