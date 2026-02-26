import React from 'react';
import logo from '../../assets/logo-black.png';
import { HamburgerIcon } from './Navbar';

export const MobileNav = React.memo(
  ({ toggleMenu, openSearch, openCart, onLogoClick, cartCount }) => (
    <div className="flex md:hidden justify-between items-center h-[59px] px-navbar w-full font-arial relative">
      <div className="flex items-center gap-4">
        <button onClick={toggleMenu}>
          <HamburgerIcon />
        </button>
        <button
          onClick={openSearch}
          className="text-[13px] uppercase font-medium"
        >
          ПОИСК
        </button>
      </div>

      <div
        className="absolute left-1/2 -translate-x-1/2 cursor-pointer"
        onClick={onLogoClick}
      >
        <img src={logo} alt="Логотип" className="h-logo w-auto" />
      </div>

      <button
        onClick={openCart}
        className="flex items-center text-[13px] uppercase font-medium gap-2"
      >
        <span>КОРЗИНА</span>
        <span className="min-w-[10px]">{cartCount}</span>
      </button>
    </div>
  )
);
