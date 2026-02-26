import { memo } from 'react';

const ModalHeaderComponent = ({ title, onClose, showBack }) => (
  <div
    className="sticky top-0 z-10 bg-white flex justify-between items-center h-[51px]
                  pl-4 pr-4 md:pl-5.5 md:pr-8 border-b border-[rgba(0,0,0,0.1)]"
  >
    {showBack ? (
      <button onClick={onClose} className="hidden md:block">
        <svg
          role="presentation"
          className="block w-[26px] h-[26px]"
          width="1em"
          height="1em"
          viewBox="0 0 26 26"
        >
          <g fillRule="evenodd" strokeWidth="2" fill="#000">
            <path d="m10.4142 5 1.4142 1.4142L5.829 12.414l17.5852.0002v2L5.829 14.414l5.9994 6.0002-1.4142 1.4142L2 13.4142 10.4142 5Z" />
          </g>
        </svg>
      </button>
    ) : (
      <div className="w-[26px] h-[26px]" />
    )}

    <h2 className="text-base leading-[1.35] font-semibold">{title}</h2>

    <button onClick={onClose}>
      <svg
        role="presentation"
        className="block"
        width="1em"
        height="1em"
        viewBox="0 0 23 23"
      >
        <g fillRule="evenodd" strokeWidth="2" fill="#000">
          <path d="M0 1.4142 2.1213-.707 23.3345 20.506l-2.1213 2.1213z" />
          <path d="m21.2132 0 2.1213 2.1213L2.1213 23.3345 0 21.2132z" />
        </g>
      </svg>
    </button>
  </div>
);

export const ModalHeader = memo(ModalHeaderComponent);
