import React from 'react';
import removeItem from '../../assets/remove-item.svg';

export const FavoriteItem = React.memo(
  ({ item, available, onAddToCart, onRemoveFavorite }) => {
    const price = Number(item.price).toLocaleString();

    return (
      <div className="py-2.5 px-4 md:px-0 mb-5 gap-2 md:gap-0 flex w-full items-start md:items-center justify-between box-border h-auto">
        <div className="flex items-start md:items-center">
          <div className="relative w-17.5 h-17.5 mr-5 flex-shrink-0">
            <img
              src={item.image}
              alt={item.title}
              className="w-full h-full md:mt-0 rounded-[7px] border border-[rgba(0,0,0,0.1)] object-cover"
            />
            {!available && (
              <div className="absolute inset-0 flex items-center justify-center rounded-[7px] bg-black/60 transition-opacity duration-300 group-hover:opacity-0">
                <span className="text-[13px] text-white font-bold uppercase">
                  SOLD OUT
                </span>
              </div>
            )}
          </div>
          <div className="md:max-w-52 font-semibold leading-[1.45] text-black">
            <a
              href={`/product/${item.id}?size=${item.selectedSize}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-lg"
            >
              {item.title}
            </a>
            <div className="text-xs font-normal mt-[5px] opacity-[0.7]">
              {price} р.
            </div>
            <div className="text-xs font-normal mt-[5px] opacity-[0.7]">
              РАЗМЕР: {item.selectedSize.toLowerCase()}
            </div>

            <div className="flex items-center gap-4 mt-2">
              {available && (
                <button
                  onClick={onAddToCart}
                  className="block md:hidden font-light h-[35px] bg-black hover:bg-[#333] text-white px-[15px] py-[5px] rounded-sm transition-colors duration-300"
                >
                  В корзину
                </button>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={onRemoveFavorite}
          className="md:hidden cursor-pointer opacity-[0.4] hover:opacity-100 transition-all duration-200"
          aria-label="Удалить из избранного"
        >
          <img src={removeItem} alt="" className="w-5 h-5" />
        </button>

        <div className="hidden md:flex items-center gap-2 flex-shrink-0">
          {available && (
            <button
              onClick={onAddToCart}
              className="cursor-pointer font-light h-[35px] bg-black hover:bg-[#333] text-white px-[15px] py-[5px] rounded-sm transition-colors duration-300"
            >
              В корзину
            </button>
          )}
          <button
            onClick={onRemoveFavorite}
            className="cursor-pointer opacity-[0.4] hover:opacity-100 p-[15px_0_15px_15px] transition-all duration-200"
            aria-label="Удалить из избранного"
          >
            <img src={removeItem} alt="" className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }
);
