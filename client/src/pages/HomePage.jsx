import { useRef, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar/Navbar';
import Carousel from '../components/Carousel/Carousel';
import ProductList from '../components/Product/ProductList';
import Quiz from '../components/Quiz/Quiz';
import AboutSection from '../components/About/AboutSection';
import Footer from '../components/Footer/Footer';
import useScrollListener from '../hooks/useScrollListener';
import Lottie from 'lottie-react';
import giftAnim from '../assets/animations/gift.json';
import { useCart } from '../context/CartContext';
import { useFavorites } from '../context/FavoritesContext';
import { useModal } from '../context/ModalContext';

const HomePage = () => {
  const [showQuiz, setShowQuiz] = useState(false);
  const [hover, setHover] = useState(false);
  const lottieRef = useRef(null);

  const { isCartOpen } = useCart();
  const { isFavoritesOpen } = useFavorites();
  const { isAnyModalOpen } = useModal();

  const catalogRef = useRef(null);
  const aboutRef = useRef(null);
  const contactRef = useRef(null);
  const location = useLocation();

  const mainScrollRef = useRef(null);
  const isProductPage = location.pathname.startsWith('/product/');

  const scrollMap = {
    catalog: catalogRef,
    about: aboutRef,
    contact: contactRef,
  };

  useEffect(() => {
    if (lottieRef.current) {
      lottieRef.current.setSpeed(0.5);
    }
  }, [hover, lottieRef.current]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const scrollTarget = params.get('scrollTarget');

    if (scrollTarget && scrollMap[scrollTarget]?.current) {
      setTimeout(() => {
        scrollMap[scrollTarget].current?.scrollIntoView({ behavior: 'smooth' });
      }, 500);
    }
  }, [location.search]);

  useScrollListener((target) => {
    scrollMap[target]?.current?.scrollIntoView({ behavior: 'smooth' });
  });

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      {!showQuiz && !isCartOpen && !isFavoritesOpen && !isAnyModalOpen && (
        <button
          onClick={() => setShowQuiz(true)}
          aria-label="Пройти викторину"
          className={`
            hidden top-[90px] right-6 z-50
            bg-[hsla(0,0%,100%,.8)] shadow-[0_2px_3px_rgba(0,11,48,0.25)]
            overflow-hidden rounded-full
            transition-all duration-200
            ${hover ? 'w-28 h-28' : 'w-20 h-20 md:w-24 md:h-24'}
          `}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
        >
          <Lottie
            lottieRef={lottieRef}
            animationData={giftAnim}
            autoplay
            loop={hover}
            style={{ marginLeft: '-5px', width: '110%', height: '110%' }}
          />
        </button>
      )}

      <div
        ref={mainScrollRef}
        className="relative z-20 flex-1 overflow-y-auto scroll-container scroll-fade-in transition-opacity duration-300"
      >
        <Navbar
          scrollContainerRef={mainScrollRef}
          onCatalogClick={() =>
            catalogRef.current?.scrollIntoView({ behavior: 'smooth' })
          }
          onAboutClick={() =>
            aboutRef.current?.scrollIntoView({ behavior: 'smooth' })
          }
          onContactClick={() =>
            contactRef.current?.scrollIntoView({ behavior: 'smooth' })
          }
        />
        <Carousel />
        <div ref={catalogRef}>
          <ProductList />
        </div>

        {/* {showQuiz && <Quiz />} */}

        <div ref={aboutRef}>
          <AboutSection />
        </div>
        <div ref={contactRef}>
          <Footer
            scrollContainerRef={mainScrollRef}
            onCatalogClick={() =>
              catalogRef.current?.scrollIntoView({ behavior: 'smooth' })
            }
            onAboutClick={() =>
              aboutRef.current?.scrollIntoView({ behavior: 'smooth' })
            }
            onContactClick={() =>
              contactRef.current?.scrollIntoView({ behavior: 'smooth' })
            }
          />
        </div>
      </div>
    </div>
  );
};

export default HomePage;
