import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { sameVariant } from '../utils/variant';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [isCartOpen, setCartOpen] = useState(false);
  const isInitialMount = useRef(true);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('cart') || '[]');
    setCart(stored);
  }, []);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'cart') setCart(JSON.parse(e.newValue || '[]'));
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const addToCart = (item) => {
    setCart((curr) => {
      const exists = curr.find((p) => sameVariant(p, item));
      if (exists) {
        return curr.map((p) =>
          sameVariant(p, item)
            ? { ...p, quantity: p.quantity + item.quantity }
            : p
        );
      } else {
        return [...curr, item];
      }
    });
  };
  const removeFromCart = (item) =>
    setCart((curr) => curr.filter((p) => !sameVariant(p, item)));
  const updateQuantity = (item) =>
    setCart((curr) =>
      curr.map((p) => (sameVariant(p, item) ? { ...p, quantity: item.quantity } : p))
    );

  const openCart = () => setCartOpen(true);
  const closeCart = () => setCartOpen(false);
  const clearCart = () => setCart([]);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        isCartOpen,
        openCart,
        closeCart,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
