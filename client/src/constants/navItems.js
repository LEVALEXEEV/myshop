import { scrollOrNavigate, navigateAndScrollTop } from '../utils/scrollHelpers';

export const NAV_ITEMS = [
  {
    label: 'Каталог',
    action: ({ location, navigate, callbacks }) =>
      scrollOrNavigate({ location, navigate, target: 'catalog', callbacks }),
  },
  {
    label: 'О бренде',
    action: ({ location, navigate, callbacks }) =>
      scrollOrNavigate({ location, navigate, target: 'about', callbacks }),
  },
  {
    label: 'Доставка и оплата',
    action: ({ navigate }) =>
      navigateAndScrollTop(navigate, '/buyers?tab=delivery'),
  },
  {
    label: 'Контакты',
    action: ({ location, navigate, callbacks }) =>
      scrollOrNavigate({ location, navigate, target: 'contact', callbacks }),
  },
];
