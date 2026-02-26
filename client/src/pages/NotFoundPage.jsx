import { useRef, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar/Navbar';
import Footer from '../components/Footer/Footer';
import Quiz from '../components/Quiz/Quiz';
import Lottie from 'lottie-react';
import giftAnim from '../assets/animations/gift.json';
import useScrollListener from '../hooks/useScrollListener';
import { useCart } from '../context/CartContext';
import { useFavorites } from '../context/FavoritesContext';
import { useModal } from '../context/ModalContext';

const NotFoundPage = () => {
  const mainScrollRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  const { isCartOpen } = useCart();
  const { isFavoritesOpen } = useFavorites();
  const { isAnyModalOpen } = useModal();
  const [showQuiz, setShowQuiz] = useState(false);
  const [hover, setHover] = useState(false);
  const lottieRef = useRef(null);

  useEffect(() => {
    if (lottieRef.current) {
      lottieRef.current.setSpeed(0.5);
    }
  }, [hover]);

  const scrollMap = {};
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const target = params.get('scrollTarget');
    if (target && scrollMap[target]?.current) {
      setTimeout(() => {
        scrollMap[target].current.scrollIntoView({ behavior: 'smooth' });
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
        <Navbar scrollContainerRef={mainScrollRef} />

        <div
          className="font-arial flex flex-col items-center justify-center
             min-h-full px-4 py-20"
        >
          <div className="max-w-xs md:max-w-[45rem] text-center">
            <h1 className="text-xl md:text-3xl font-bold mb-8">ERROR 404</h1>
            <p className="text-sm leading-[16px] md:leading-[25px] md:text-lg mb-[50px]">
              Что-то пошло не так, возможно страница, которую вы хотите найти,
              была удалена или её просто не существует. Перейдите в каталог,
              чтобы продолжить выбор.
            </p>
            <button
              onClick={() => navigate('/?scrollTarget=catalog')}
              className="min-w-[280px] md:min-w-[370px] h-[46px] md:h-[56px] text-[13px] md:text-[17px]
              bg-black text-white uppercase font-semibold rounded-lg md:rounded-sm hover:opacity-85 transition"
            >
              В каталог
            </button>
          </div>
        </div>

        <Footer scrollContainerRef={mainScrollRef} />
      </div>

      {/* {showQuiz && <Quiz />} */}
    </div>
  );
};

export default NotFoundPage;
