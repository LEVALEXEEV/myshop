import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import logo from '../../assets/logo-black.png';
import FavoritesDrawer from '../Favorites/FavoritesDrawer';
import CartDrawer from '../Cart/CartDrawer';
import SearchPanel from './SearchPanel';
import { useFavorites } from '../../context/FavoritesContext';
import { useCart } from '../../context/CartContext';
import { useStickyHeader } from '../../hooks/useStickyHeader';
import { NAV_ITEMS } from '../../constants/navItems';
import { SocialLink } from './SocialLink';
import { footerLinks } from '../../constants/footerLinks';
import { DesktopNav } from './DesktopNav';
import { MobileNav } from './MobileNav';

export const HamburgerIcon = React.memo(() => (
  <svg width={20} height={20} fill="currentColor" viewBox="0 0 24 24">
    <rect y="4" width="24" height="2" />
    <rect y="11" width="24" height="2" />
    <rect y="18" width="24" height="2" />
  </svg>
));
export const CloseIcon = React.memo(() => (
  <svg width={24} height={24}>
    <line x1="4" y1="4" x2="20" y2="20" stroke="#656565" strokeWidth="2" />
    <line x1="20" y1="4" x2="4" y2="20" stroke="#656565" strokeWidth="2" />
  </svg>
));

function Navbar({
  scrollContainerRef,
  onCatalogClick,
  onAboutClick,
  onContactClick,
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const { isScrolled, animClass, clearAnim } =
    useStickyHeader(scrollContainerRef);
  const { favorites, isFavoritesOpen, openFavorites, closeFavorites } =
    useFavorites();
  const { cart, openCart } = useCart();
  const [showSearch, setShowSearch] = useState(false);
  const [animState, setAnimState] = useState('enter');
  const [mobileOpen, setMobileOpen] = useState(false);

  const callbacks = {
    catalog: onCatalogClick,
    about: onAboutClick,
    contact: onContactClick,
  };

  const SEARCH_ANIM_MS = 200;

  const openSearch = useCallback(() => {
    setAnimState('enter');
    setShowSearch(true);
  }, []);
  const closeSearch = useCallback(() => {
    setAnimState('leave');
    setTimeout(() => setShowSearch(false), SEARCH_ANIM_MS);
  }, []);
  const showFavs = useCallback(() => openFavorites(), [openFavorites]);
  const hideMobile = useCallback(() => setMobileOpen(false), []);
  const toggleMobile = useCallback(() => setMobileOpen((v) => !v), []);
  const openCartCb = useCallback(openCart, [openCart]);

  const handleLogoClick = useCallback(() => {
    navigate('/');
    const container = scrollContainerRef?.current ?? window;
    container.scrollTo({ top: 0, behavior: 'smooth' });
  }, [navigate, scrollContainerRef]);

  const buttonClasses =
    'text-black text-navbar cursor-pointer font-normal tracking-[-0.3px] leading-none uppercase rounded-[30px] border border-transparent bg-center';

  const mobileButtonClasses =
    'text-left text-black text-[17px] uppercase font-medium tracking-tight leading-[1.6]';

  const navButtons = useMemo(
    () =>
      NAV_ITEMS.map((item) => (
        <button
          key={item.label}
          className={buttonClasses}
          onClick={() => item.action({ location, navigate, callbacks })}
        >
          {item.label}
        </button>
      )),
    [location, navigate, onCatalogClick, onAboutClick, onContactClick]
  );

  const mobileNavButtons = useMemo(
    () => (
      <>
        {NAV_ITEMS.map((item) => (
          <button
            key={item.label}
            className={mobileButtonClasses}
            onClick={() => {
              item.action({ location, navigate, callbacks });
              hideMobile();
            }}
          >
            {item.label}
          </button>
        ))}
        <button
          className={mobileButtonClasses}
          onClick={() => {
            showFavs();
            hideMobile();
          }}
        >
          Избранное <span className="ml-2">{favorites.length}</span>
        </button>
      </>
    ),
    [
      location,
      navigate,
      onCatalogClick,
      onAboutClick,
      onContactClick,
      hideMobile,
      showFavs,
      favorites.length,
    ]
  );

  const rightButtons = useMemo(
    () => (
      <>
        <button className={buttonClasses} onClick={openSearch}>
          Поиск
        </button>
        <button className={buttonClasses} onClick={showFavs}>
          Избранное <span className="ml-3">{favorites.length}</span>
        </button>
        <button className={buttonClasses} onClick={openCartCb}>
          Корзина <span className="ml-3">{cart.length}</span>
        </button>
      </>
    ),
    [openSearch, showFavs, openCartCb, favorites.length, cart.length]
  );

  const mobileMenu = useMemo(
    () => (
      <div
        className={`font-arial fixed inset-0 z-50 bg-white flex flex-col px-4 pt-4 pb-6 transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex justify-between items-center mb-12">
          <img src={logo} alt="Resego" className="h-8" />
          <button onClick={hideMobile}>
            <CloseIcon />
          </button>
        </div>

        <div className="text-[15px] mb-2 text-[#9b9b9b] font-light">
          Навигация
        </div>
        <nav className="flex flex-col gap-4 text-[17px] font-medium">
          {mobileNavButtons}
        </nav>

        <div className="mt-10 text-[15px] mb-2 text-[#9b9b9b] font-light">
          Соц.сети
        </div>
        <div className="flex flex-col gap-4 uppercase text-[17px]">
          {footerLinks.contacts_mobile.map(({ label, href }) => (
            <SocialLink key={href} href={href}>
              {label}
            </SocialLink>
          ))}
        </div>

        <div
          onClick={() => {
            navigate('/');
            (scrollContainerRef?.current ?? window).scrollTo({
              top: 0,
              behavior: 'smooth',
            });
            hideMobile();
          }}
          className="mt-12 text-[#9b9b9b] text-[10px] font-light font-roboto"
        >
          <span className="text-black whitespace-normal">Resego™</span> — бренд объединяющий спорт и уличный стиль через одежду и делает это главным принципом в создании своих коллекций.
        </div>
      </div>
    ),
    [mobileOpen, hideMobile, mobileNavButtons, navigate, scrollContainerRef]
  );

  useEffect(() => {
    document.documentElement.classList.toggle('no-scroll', mobileOpen);
  }, [mobileOpen]);

  return (
    <>
      <SearchPanel
        visible={showSearch}
        onClose={closeSearch}
        animState={animState}
        scrollContainerRef={scrollContainerRef}
      />

      <header
        onAnimationEnd={clearAnim}
        className={`
          navbar w-full bg-white text-black
          sticky top-0 z-40
          ${isScrolled ? 'shadow-md' : ''}
          ${animClass}
          ${showSearch ? 'opacity-0 pointer-events-none' : 'opacity-100'}
        `}
      >
        <DesktopNav
          navButtons={navButtons}
          rightButtons={rightButtons}
          onLogoClick={handleLogoClick}
        />
        <MobileNav
          toggleMenu={toggleMobile}
          openSearch={openSearch}
          openCart={openCartCb}
          onLogoClick={handleLogoClick}
          cartCount={cart.length}
        />
      </header>

      {mobileMenu}
      <FavoritesDrawer isOpen={isFavoritesOpen} onClose={closeFavorites} />
      <CartDrawer />
    </>
  );
}

export default React.memo(Navbar);
