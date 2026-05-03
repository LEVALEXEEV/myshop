export const variantKey = (item) =>
  `${item.id}-${item.selectedSize ?? ''}-${item.selectedColor ?? ''}`;

export const sameVariant = (a, b) =>
  a.id === b.id &&
  (a.selectedSize ?? '') === (b.selectedSize ?? '') &&
  (a.selectedColor ?? '') === (b.selectedColor ?? '');

// Находит запись остатков, соответствующую выбранному варианту.
export const findStockEntry = (stock, item) => {
  if (!Array.isArray(stock)) return null;
  const size = item.selectedSize ?? '';
  const color = item.selectedColor ?? '';
  return (
    stock.find(
      (s) => (s.size ?? '') === size && (s.color ?? '') === color
    ) || null
  );
};
