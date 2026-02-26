import { useEffect, useState, useCallback } from 'react';
import { useCart } from '../../context/CartContext';
import { useFavorites } from '../../context/FavoritesContext';
import { FavoriteItem } from './FavoriteItem';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import axios from 'axios';
import Toast from '../ui/Toast';

const FavoritesDrawer = ({ isOpen, onClose }) => {
  const { favorites, toggleFavorite } = useFavorites();
  const { cart, addToCart, updateQuantity, openCart } = useCart();
  const [stockMap, setStockMap] = useState({});
  const [toastMsg, setToastMsg] = useState('');
  const [showToast, setShowToast] = useState(false);

  useBodyScrollLock(isOpen);

  useEffect(() => {
    const ids = [...new Set(favorites.map((f) => f.id))];
    if (ids.length === 0) {
      setStockMap({});
      return;
    }
    axios
      .get('/api/products', { params: { ids: ids.join(',') } })
      .then(({ data: products }) => {
        const map = {};
        products.forEach((p) => {
          map[p.id] = p.stock || [];
        });
        setStockMap(map);
      })
      .catch(() => {
        setStockMap({});
      });
  }, [favorites]);

  const handleAddToCart = useCallback(
    async (item) => {
      try {
        const { data: fresh } = await axios.get(`/api/products/${item.id}`);
        const stockEntry = fresh.stock.find(
          (s) => s.size === item.selectedSize
        );
        const available = stockEntry?.qty ?? 0;

        const exists = cart.find(
          (p) => p.id === item.id && p.selectedSize === item.selectedSize
        );
        const inCart = exists ? exists.quantity : 0;

        if (available - inCart < 1) {
          setToastMsg(
            `Нельзя добавить: в наличии только ${available} шт. данного размера`
          );
          setShowToast(true);
          return;
        }

        if (exists) {
          updateQuantity({
            id: item.id,
            selectedSize: item.selectedSize,
            quantity: inCart + 1,
          });
        } else {
          addToCart({ ...item, quantity: 1 });
        }

        onClose();
        setTimeout(openCart, 300);
      } catch (err) {
        console.error('Ошибка при проверке остатка:', err);
        setToastMsg('Не удалось проверить наличие, попробуйте чуть позже');
        setShowToast(true);
      }
    },
    [cart, addToCart, updateQuantity, openCart, onClose]
  );

  return (
    <>
      <div
        className={`fixed inset-0 z-[100] transition-opacity duration-300 ${
          isOpen
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="absolute inset-0 bg-black/10" onClick={onClose} />

        <div
          className={`absolute right-0 top-0 h-full w-full pb-4 md:pb-10 md:pt-10 md:px-10 max-w-[560px]
                    bg-white shadow-[0_0_10px_0_rgba(0,0,0,0.2)]
                    transform transition-transform duration-300 overflow-y-auto ${
                      isOpen ? 'translate-x-0' : 'translate-x-full'
                    }`}
        >
          <div
            className="
            sticky top-0 z-20 bg-white flex justify-between items-center
            px-4 md:px-0 border-b border-[rgba(0,0,0,0.2)] pt-4 pb-4 md:pt-0 md:pb-5 mb-5
            md:static md:bg-transparent
          "
          >
            <h2 className="text-xl md:text-2xl leading-[1.35] font-semibold">
              Избранное
            </h2>
            <button
              onClick={onClose}
              aria-label="Закрыть"
              className="cursor-pointer"
            >
              <svg
                viewBox="0 0 23 23"
                className="w-[18px] h-[18px] md:w-[23px] md:h-[23px]"
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

          {favorites.length > 0 ? (
            favorites.map((item) => {
              const stock = stockMap[item.id] || [];
              const entry = stock.find((s) => s.size === item.selectedSize);
              const available = (entry?.qty ?? 0) > 0;

              return (
                <FavoriteItem
                  key={`${item.id}-${item.selectedSize}`}
                  item={item}
                  available={available}
                  onAddToCart={() => handleAddToCart(item)}
                  onRemoveFavorite={() => toggleFavorite(item)}
                />
              );
            })
          ) : (
            <div className="text-sm text-gray-500 px-4 md:px-0">
              Список избранных товаров пуст.
            </div>
          )}
        </div>
      </div>
      {showToast && (
        <Toast
          message={toastMsg}
          variant="error"
          onClose={() => setShowToast(false)}
        />
      )}
    </>
  );
};

export default FavoritesDrawer;
