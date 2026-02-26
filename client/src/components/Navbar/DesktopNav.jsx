import React from 'react';
import logo from '../../assets/logo-black.png';

export const DesktopNav = React.memo(
  ({ navButtons, rightButtons, onLogoClick }) => (
    <div className="hidden md:flex justify-between items-center min-h-navbar py-4 px-navbar w-full relative">
      <nav className="flex gap-5">{navButtons}</nav>

      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-pointer"
        onClick={onLogoClick}
      >
        <img src={logo} alt="Логотип" className="h-logo w-auto" />
      </div>

      <div className="flex gap-5">{rightButtons}</div>
    </div>
  )
);
