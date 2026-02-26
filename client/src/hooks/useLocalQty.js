import { useState, useEffect } from 'react';

export function useLocalQty(cart) {
  const [localQty, setLocalQty] = useState({});

  useEffect(() => {
    const map = {};
    cart.forEach((item) => {
      const key = `${item.id}-${item.selectedSize}`;
      map[key] = String(item.quantity);
    });
    setLocalQty(map);
  }, [cart]);

  return [localQty, setLocalQty];
}
