import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useKeenSlider } from 'keen-slider/react';
import 'keen-slider/keen-slider.min.css';
import ProductModal from './ProductModal';
import { Squares2X2Icon, ViewColumnsIcon } from '@heroicons/react/24/outline';
import { CATEGORY_OPTIONS } from '../../constants/productCategories';
import { useAnimateOnView } from '../../hooks/useAnimateOnView';

const SLIDER_OPTIONS = {
  loop: false,
  slides: { perView: 4, spacing: 20 },
  breakpoints: {
    '(max-width: 768px)': { slides: { perView: 2, spacing: 15 } },
  },
  mode: 'snap',
  renderMode: 'performance',
};

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState('Все');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [currentSlide, setCurrentSlide] = useState(0);
  const gridRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get('/api/products', { params: category === 'Все' ? {} : { category } })
      .then((res) => setProducts(res.data))
      .catch(console.error);
  }, [category]);

  const relatedRandom = useMemo(() => {
    if (!selectedProduct) return [];
    const others = products.filter((p) => p.id !== selectedProduct.id);
    return shuffle(others).slice(0, 4);
  }, [selectedProduct, products]);

  const openModal = useCallback(
    (product) => {
      setSelectedProduct(product);
      navigate(`?product=${product.id}`, { replace: false });
    },
    [navigate]
  );
  const closeModal = useCallback(() => {
    setSelectedProduct(null);
    navigate(location.pathname, { replace: true });
  }, [navigate, location.pathname]);

  useEffect(() => {
    if (!products.length) return;
    const id = new URLSearchParams(location.search).get('product');
    const p = products.find((x) => String(x.id) === id);
    if (p) openModal(p);
  }, [location.search, openModal, products]);

  useAnimateOnView(
    gridRef,
    '.product-item',
    { threshold: 0.1 },
    'animate-fadeInOpacity',
    [products.length, viewMode]
  );

  const sliderOptions = useMemo(
    () => ({
      ...SLIDER_OPTIONS,
      slideChanged: (s) => setCurrentSlide(s.track.details.rel),
    }),
    []
  );

  const [sliderRef, slider] = useKeenSlider(sliderOptions);

  useEffect(() => {
    if (viewMode !== 'carousel' || !slider) return;
    const id = setInterval(() => slider.current.next(), 5000);
    return () => clearInterval(id);
  }, [slider, viewMode]);

  return (
    <div className="w-full pt-[40px] md:pt-[60px] px-5 md:px-[40px]">
      <div className="flex justify-between items-center mb-[30px]">
        <div className="hidden md:block md:w-1/3" />
        {viewMode === 'carousel' && (
          <div className="block md:hidden w-1/3 md:w-0" />
        )}
        {viewMode === 'grid' && (
          <div className="flex gap-3 text-xs justify-center md:w-1/3">
            {CATEGORY_OPTIONS.map(({ key, label }) => (
              <button
                key={key}
                className={`uppercase cursor-pointer ${
                  category === key ? 'text-gray-500' : 'text-black'
                }`}
                onClick={() => setCategory(key)}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 md:w-1/3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`
                p-2 rounded cursor-pointer transition-colors duration-200
                ${
                  viewMode === 'grid'
                    ? 'bg-gray-200 text-gray-800'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                }
              `}
              aria-label="Grid View"
            >
              <Squares2X2Icon className="w-6 h-6" />
            </button>
            <button
              onClick={() => setViewMode('carousel')}
              className={`
                p-2 rounded cursor-pointer transition-colors duration-200
                ${
                  viewMode === 'carousel'
                    ? 'bg-gray-200 text-gray-800'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                }
              `}
              aria-label="Carousel View"
            >
              <ViewColumnsIcon className="w-6 h-6" />
            </button>
          </div>

          {viewMode === 'carousel' && (
            <div
              className="
                flex gap-2 ml-2 md:ml-4
                animate-fadeInRight
              "
            >
              <button
                onClick={() => slider.current?.prev()}
                className="
                  w-10 h-10 bg-white cursor-pointer shadow rounded-[12px] bg-center bg-no-repeat
                  transition transform duration-200
                  hover:scale-105 hover:shadow-lg hover:bg-gray-50
                "
                style={{
                  backgroundImage: "url('/prev.svg')",
                  backgroundSize: 'cover',
                }}
                aria-label="Prev slide"
              />
              <button
                onClick={() => slider.current?.next()}
                className="
                  w-10 h-10 bg-white cursor-pointer shadow rounded-[12px] bg-center bg-no-repeat
                  transition transform duration-200
                  hover:scale-105 hover:shadow-lg hover:bg-gray-50
                "
                style={{
                  backgroundImage: "url('/next.svg')",
                  backgroundSize: 'cover',
                }}
                aria-label="Next slide"
              />
            </div>
          )}
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div
          ref={gridRef}
          className="grid grid-cols-2 zoom-cols-2 md:grid-cols-3 gap-x-3 gap-y-8"
        >
          {products.map((product, idx) => (
            <div
              key={product.id}
              className="product-item opacity-0"
              style={{ transitionDelay: `${idx * 100}ms` }}
            >
              <Link
                to={`/product/${product.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  openModal(product);
                }}
              >
                <div className="w-full aspect-square overflow-hidden relative group">
                  <img
                    src={product.image}
                    alt={product.title}
                    className={`
                      w-full h-full object-cover transition-opacity duration-300
                      ${
                        product.sold_out
                          ? 'opacity-100 group-hover:opacity-100'
                          : ''
                      }
                      ${
                        product.image_hover && !product.sold_out
                          ? 'group-hover:opacity-0'
                          : ''
                      }
                    `}
                  />
                  {product.image_hover && !product.sold_out && (
                    <img
                      src={product.image_hover}
                      alt={`${product.title} hover`}
                      className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    />
                  )}
                  {product.sold_out && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 transition-opacity duration-300 group-hover:opacity-0">
                      <span className="text-3xl text-white font-bold uppercase block md:hidden">
                        SOLD OUT
                      </span>
                      <span className="sold-out-text hidden md:block">
                        SOLD OUT
                      </span>
                    </div>
                  )}
                </div>
                <div className="mt-4">
                  <h3 className="text-sm uppercase font-normal">
                    {product.title}
                  </h3>
                  <p className="text-sm mt-2 font-light">
                    {Number(product.price).toLocaleString()} р.
                  </p>
                  {product.sold_out && (
                    <p className="text-sm text-[#f95d51] mt-1">Нет в наличии</p>
                  )}
                </div>
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <div>
          <div
            key="carousel"
            ref={sliderRef}
            className="keen-slider animate-fadeInOpacity"
            style={{ animationDuration: '0.5s' }}
          >
            {products.map((product) => (
              <div
                key={product.id}
                className="keen-slider__slide cursor-pointer"
              >
                <Link
                  to={`/product/${product.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    openModal(product);
                  }}
                >
                  <div className="w-full aspect-square overflow-hidden rounded-lg relative group">
                    <img
                      src={product.image}
                      alt={product.title}
                      className={`
                        w-full h-full object-cover transition-opacity duration-300
                        ${
                          product.sold_out
                            ? 'opacity-100 group-hover:opacity-100'
                            : ''
                        }
                        ${
                          product.image_hover && !product.sold_out
                            ? 'group-hover:opacity-0'
                            : ''
                        }
                      `}
                    />
                    {product.image_hover && !product.sold_out && (
                      <img
                        src={product.image_hover}
                        alt={`${product.title} hover`}
                        className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                      />
                    )}
                    {product.sold_out && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/60 transition-opacity duration-300 group-hover:opacity-0">
                        <span className="text-3xl text-white font-bold uppercase block md:hidden">
                          SOLD OUT
                        </span>
                        <span className="sold-out-text-carousel hidden md:block">
                          SOLD OUT
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="mt-3">
                    <h3 className="text-sm uppercase font-normal">
                      {product.title}
                    </h3>
                    <p className="text-sm mt-1 font-light">
                      {Number(product.price).toLocaleString()} р.
                    </p>
                    {product.sold_out && (
                      <p className="text-sm text-[#f95d51] mt-1">
                        Нет в наличии
                      </p>
                    )}
                  </div>
                </Link>
              </div>
            ))}
          </div>

          <div className="flex gap-2 mt-5 md:mt-[60px]">
            {products.map((_, idx) => (
              <div
                key={idx}
                onClick={() => slider.current?.moveToIdx(idx)}
                className="indicator cursor-pointer"
                style={{
                  flex: currentSlide === idx ? 1.5 : 1,
                  transition: 'flex 0.3s',
                }}
              >
                {currentSlide === idx && (
                  <div key={currentSlide} className="indicator-fill" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          relatedProducts={relatedRandom}
          onClose={closeModal}
          onSelectProduct={openModal}
        />
      )}
    </div>
  );
};

export default ProductList;
