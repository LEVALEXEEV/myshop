import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { FavoritesProvider } from './context/FavoritesContext';
import { CartProvider } from './context/CartContext';
import setScrollbarWidth from './setScrollbarWidth';

if (typeof document !== 'undefined') {
  setScrollbarWidth();
  window.addEventListener('resize', setScrollbarWidth);
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <FavoritesProvider>
      <CartProvider>
        <App />
      </CartProvider>
    </FavoritesProvider>
  </StrictMode>
);
