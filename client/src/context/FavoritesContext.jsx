import { createContext, useContext, useEffect, useRef, useState } from 'react';

const FavoritesContext = createContext();

export const FavoritesProvider = ({ children }) => {
  const [favorites, setFavorites] = useState([]);
  const [isFavoritesOpen, setFavoritesOpen] = useState(false);
  const isInitialMount = useRef(true);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('favorites') || '[]');
    setFavorites(stored);
  }, []);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    localStorage.setItem('favorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === 'favorites') {
        setFavorites(JSON.parse(e.newValue || '[]'));
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const openFavorites = () => setFavoritesOpen(true);
  const closeFavorites = () => setFavoritesOpen(false);

  const toggleFavorite = (product) => {
    setFavorites((curr) => {
      const exists = curr.some(
        (p) => p.id === product.id && p.selectedSize === product.selectedSize
      );
      if (exists) {
        return curr.filter(
          (p) =>
            !(p.id === product.id && p.selectedSize === product.selectedSize)
        );
      } else {
        return [...curr, product];
      }
    });
  };

  const isFavorite = (product) =>
    favorites.some(
      (p) => p.id === product.id && p.selectedSize === product.selectedSize
    );

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        toggleFavorite,
        isFavorite,
        isFavoritesOpen,
        openFavorites,
        closeFavorites,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => useContext(FavoritesContext);
