import { memo } from 'react';

const FavoriteButton = ({ isFavorited, onClick, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    aria-label="Добавить в избранное"
    className="ml-3.5 mr-3.5 md:mr-0 cursor-pointer transition-transform duration-200 hover:scale-110 group disabled:cursor-default disabled:opacity-50"
  >
    <svg
      width="21"
      height="18"
      viewBox="0 0 21 18"
      xmlns="http://www.w3.org/2000/svg"
      className="transition-all duration-200 group-hover:fill-[#ff0000] group-hover:stroke-[#ff0000]"
      stroke={isFavorited ? '#ff0000' : 'black'}
      fill={isFavorited ? '#ff0000' : 'none'}
    >
      <path
        d="M20 6.32647C20 11.4974 10.5 17 10.5 17C10.5 17 1 11.4974 1 6.32647C1 -0.694364 10.5 -0.599555 10.5 5.57947C10.5 -0.599555 20 -0.507124 20 6.32647Z"
        strokeLinejoin="round"
      />
    </svg>
  </button>
);

export default memo(FavoriteButton);
