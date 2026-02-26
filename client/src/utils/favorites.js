export const getFavorites = () =>
  JSON.parse(localStorage.getItem('favorites') || '[]');

export const toggleFavorite = (product) => {
  let favorites = getFavorites();
  const exists = favorites.some((p) => p.id === product.id);
  if (exists) {
    favorites = favorites.filter((p) => p.id !== product.id);
  } else {
    favorites.push(product);
  }
  localStorage.setItem('favorites', JSON.stringify(favorites));
  window.dispatchEvent(new Event('favoritesChange'));
};

export const isFavorite = (productId) =>
  getFavorites().some((p) => p.id === productId);
