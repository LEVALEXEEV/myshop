import PropTypes from 'prop-types';

export default function SearchResultItem({ product }) {
  return (
    <a
      href={`/product/${product.id}`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-start gap-4 rounded md:p-3 hover:shadow transition-shadow"
    >
      <div className="relative w-[70px] h-[70px] flex-shrink-0">
        <img
          src={product.image}
          alt={product.title}
          className="w-full h-full object-cover"
        />
        {product.sold_out && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 transition-opacity duration-300 group-hover:opacity-0">
            <span className="text-[13px] text-white font-bold uppercase">
              SOLD OUT
            </span>
          </div>
        )}
      </div>
      <div className="flex-1">
        <h4 className="text-sm md:text-base font-semibold">{product.title}</h4>
        <p className="text-sm md:text-base text-gray-500">
          {Number(product.price).toLocaleString()} р.
        </p>
      </div>
    </a>
  );
}

SearchResultItem.propTypes = {
  product: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    title: PropTypes.string,
    price: PropTypes.number,
    image: PropTypes.string,
    sold_out: PropTypes.bool,
  }).isRequired,
};
