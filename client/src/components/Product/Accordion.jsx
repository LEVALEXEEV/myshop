import { createContext, useContext, useState, useCallback, memo } from 'react';
import { PlusIcon } from '../ui/PlusIcon';

const AccordionContext = createContext({
  openIndex: null,
  setOpenIndex: () => {},
});

export function AccordionGroup({ children, defaultOpenIndex = null }) {
  const [openIndex, setOpenIndex] = useState(defaultOpenIndex);
  return (
    <AccordionContext.Provider value={{ openIndex, setOpenIndex }}>
      {children}
    </AccordionContext.Provider>
  );
}

const _Accordion = ({ index, title, children }) => {
  const { openIndex, setOpenIndex } = useContext(AccordionContext);
  const open = openIndex === index;
  const hasBorder = !open;

  const toggle = useCallback(() => {
    setOpenIndex(open ? null : index);
  }, [open, index, setOpenIndex]);

  return (
    <div>
      <button
        onClick={toggle}
        className={`
          w-full flex justify-between items-center py-5 px-4
          uppercase text-sm font-medium
          ${hasBorder ? 'border-b border-black' : ''}
          group
        `}
      >
        <span>{title}</span>
        <PlusIcon isOpen={open} />
      </button>
      <div
        className={`
          overflow-hidden transition-all duration-300 ease-in-out px-4
          ${open ? 'max-h-[625px] opacity-100' : 'max-h-0 opacity-0'}
        `}
      >
        {children}
      </div>
    </div>
  );
};

export const Accordion = memo(_Accordion);
