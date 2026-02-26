import { createContext, useContext, useState, useCallback } from 'react';

const ModalContext = createContext({
  open: () => {},
  close: () => {},
  isAnyModalOpen: false,
});

export const ModalProvider = ({ children }) => {
  const [count, setCount] = useState(0);

  const open = useCallback(() => setCount((c) => c + 1), []);
  const close = useCallback(() => setCount((c) => Math.max(0, c - 1)), []);

  return (
    <ModalContext.Provider value={{ open, close, isAnyModalOpen: count > 0 }}>
      {children}
    </ModalContext.Provider>
  );
};

export const useModal = () => useContext(ModalContext);
