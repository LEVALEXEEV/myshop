import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useKeenSlider } from 'keen-slider/react';
import 'keen-slider/keen-slider.min.css';
import ProductModal from './ProductModal';
import {
  Squares2X2Icon,
  ViewColumnsIcon,
  ShoppingBagIcon,
} from '@heroicons/react/24/outline';
import { CATEGORY_OPTIONS } from '../../constants/productCategories';
import { useAnimateOnView } from '../../hooks/useAnimateOnView';
import useABExperiment from '../Analytics/useABExperiment';
import { trackAbConversion } from '../Analytics/metrika';
import { useCart } from '../../context/CartContext';

const SLIDER_OPTIONS = {
  loop: false,
  slides: { perView: 4, spacing: 20 },
  breakpoints: {
    '(max-width: 768px)': { slides: { perView: 2, spacing: 15 } },
  },
  mode: 'snap',
  renderMode: 'performance',
};

const SIZE_ORDER = ['xs', 's', 'm', 'l', 'xl', 'xxl', 'xxxl'];

const sortSizes = (a, b) => {
  const ia = SIZE_ORDER.indexOf(String(a).toLowerCase());
  const ib = SIZE_ORDER.indexOf(String(b).toLowerCase());
  if (ia === -1 && ib === -1) return String(a).localeCompare(String(b));
  if (ia === -1) return 1;
  if (ib === -1) return -1;
  return ia - ib;
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

  const variant = useABExperiment('catalog_cards_test', ['A', 'B', 'C']);
  const { addToCart, openCart, cart } = useCart();
  const [quickPickerFor, setQuickPickerFor] = useState(null);
  const [quickSizesMap, setQuickSizesMap] = useState({});
  const [quickLoadingFor, setQuickLoadingFor] = useState(null);

  const handleQuickAdd = useCallback(
    async (e, product, selectedSize) => {
      e.stopPropagation();
      e.preventDefault();
      try {
        const { data: fresh } = await axios.get(`/api/products/${product.id}`);
        const entry = selectedSize
          ? (fresh.stock || []).find(
              (s) => s.size === selectedSize && s.qty > 0
            ) || null
          : (fresh.stock || []).find((s) => s.qty > 0) || null;
        if (!entry) return;

        const exists = cart.find(
          (p) => p.id === product.id && p.selectedSize === entry.size
        );
        const inCart = exists ? exists.quantity : 0;
        if (entry.qty - inCart < 1) return;

        addToCart({
          id: product.id,
          title: product.title,
          price: product.price,
          image: product.image,
          selectedSize: entry.size,
          quantity: 1,
        });
        trackAbConversion('catalog_cards_test', variant, 'add_to_cart');
        openCart();
        setQuickPickerFor(null);
      } catch (err) {
        console.error('Quick add failed', err);
      }
    },
    [addToCart, cart, openCart, variant]
  );

  const handleQuickToggle = useCallback(
    async (e, product) => {
      e.stopPropagation();
      e.preventDefault();

      if (quickPickerFor === product.id) {
        setQuickPickerFor(null);
        return;
      }

      setQuickLoadingFor(product.id);
      try {
        const { data: fresh } = await axios.get(`/api/products/${product.id}`);
        const sizes = (fresh.stock || [])
          .filter((s) => s.qty > 0)
          .map((s) => s.size)
          .sort(sortSizes);
        setQuickSizesMap((prev) => ({ ...prev, [product.id]: sizes }));
        if (sizes.length > 0) {
          setQuickPickerFor(product.id);
        }
      } catch (err) {
        console.error('Quick size fetch failed', err);
      } finally {
        setQuickLoadingFor(null);
      }
    },
    [quickPickerFor]
  );

  useEffect(() => {
    if (quickPickerFor == null) return;

    const onPointerDown = (event) => {
      if (!(event.target instanceof Element)) return;
      const inQuickPicker = event.target.closest(
        `[data-quick-picker-root="${quickPickerFor}"]`
      );
      if (!inQuickPicker) {
        setQuickPickerFor(null);
      }
    };

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setQuickPickerFor(null);
      }
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [quickPickerFor]);

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
                className={`uppercase cursor-pointer ${category === key ? 'text-gray-500' : 'text-black'
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
                ${viewMode === 'grid'
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
                ${viewMode === 'carousel'
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
                      ${product.sold_out
                        ? 'opacity-100 group-hover:opacity-100'
                        : ''
                      }
                      ${product.image_hover && !product.sold_out
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
                <div className="mt-4 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-sm uppercase font-normal">
                      {product.title}
                    </h3>
                    {variant === 'C' && product.stock && product.stock.length > 0 && (
                      <div className="flex gap-2 mt-2">
                        {product.stock
                          .filter((s) => s.qty > 0)
                          .slice(0, 5)
                          .map((s) => (
                            <span key={s.size} className="text-xs uppercase font-light">
                              {s.size}
                            </span>
                          ))}
                      </div>
                    )}
                    <p className="text-sm mt-2 font-light">
                      {Number(product.price).toLocaleString()} р.
                    </p>
                    {product.sold_out && (
                      <p className="text-sm text-[#f95d51] mt-1">Нет в наличии</p>
                    )}
                  </div>
                  {variant === 'B' && !product.sold_out && (
                    <div
                      className="relative mt-0.5 shrink-0"
                      data-quick-picker-root={product.id}
                    >
                      <div
                        className={`
                          absolute right-full mr-2 top-1/2 -translate-y-1/2
                          flex items-center gap-1 rounded-full bg-white px-2 py-1 shadow
                          transition-all duration-200
                          ${
                            quickPickerFor === product.id
                              ? 'opacity-100 translate-x-0 pointer-events-auto'
                              : 'opacity-0 translate-x-2 pointer-events-none'
                          }
                        `}
                      >
                        {quickLoadingFor === product.id ? (
                          <span className="text-[10px] uppercase tracking-wide">...</span>
                        ) : (
                          (quickSizesMap[product.id] || []).map((size) => (
                            <button
                              key={size}
                              onClick={(e) => handleQuickAdd(e, product, size)}
                              className="text-[10px] uppercase font-medium px-1"
                            >
                              {size}
                            </button>
                          ))
                        )}
                      </div>

                      <button
                        onClick={(e) => handleQuickToggle(e, product)}
                        aria-label="Быстро в корзину"
                        className="rounded-full p-1.5 text-black transition-colors duration-200 hover:bg-black/5"
                      >
                        <ShoppingBagIcon className="h-4 w-4 md:h-5 md:w-5" />
                      </button>
                    </div>
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
                        ${product.sold_out
                          ? 'opacity-100 group-hover:opacity-100'
                          : ''
                        }
                        ${product.image_hover && !product.sold_out
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
                    {variant === 'B' && !product.sold_out && (
                      <div
                        className="absolute bottom-3 right-3 z-10 flex items-center gap-2"
                        data-quick-picker-root={product.id}
                      >
                        <div
                          className={`
                            flex items-center gap-1 rounded-full bg-white px-2 py-1 shadow
                            transition-all duration-200
                            ${
                              quickPickerFor === product.id
                                ? 'opacity-100 translate-x-0 pointer-events-auto'
                                : 'opacity-0 translate-x-2 pointer-events-none'
                            }
                          `}
                        >
                          {quickLoadingFor === product.id ? (
                            <span className="text-[10px] uppercase tracking-wide">...</span>
                          ) : (
                            (quickSizesMap[product.id] || []).map((size) => (
                              <button
                                key={size}
                                onClick={(e) => handleQuickAdd(e, product, size)}
                                className="text-[10px] uppercase font-medium px-1"
                              >
                                {size}
                              </button>
                            ))
                          )}
                        </div>

                        <button
                          onClick={(e) => handleQuickToggle(e, product)}
                          aria-label="Быстро в корзину"
                          className="rounded-full bg-white/95 p-2 text-black shadow"
                        >
                          <ShoppingBagIcon className="h-4 w-4 md:h-5 md:w-5" />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="mt-3">
                    <h3 className="text-sm uppercase font-normal">
                      {product.title}
                    </h3>
                    {variant === 'C' && product.stock && product.stock.length > 0 && (
                      <div className="flex gap-2 mt-2">
                        {product.stock
                          .filter((s) => s.qty > 0)
                          .slice(0, 5)
                          .map((s) => (
                            <span key={s.size} className="text-xs uppercase font-light">
                              {s.size}
                            </span>
                          ))}
                      </div>
                    )}
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
