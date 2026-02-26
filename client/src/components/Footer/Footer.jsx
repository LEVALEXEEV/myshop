import React, { useState, useCallback } from 'react';
import logo from '../../assets/logo-white.png';
import { useNavigate, useLocation } from 'react-router-dom';
import { footerLinks } from '../../constants/footerLinks';
import {
  createRenderLink,
  renderExternalLink,
} from '../../utils/renderHelpers';
import { isValidEmail } from '../../utils/validators';
import Toast from '../ui/Toast';
import SuccessModal from './SuccessModal';
import { SubscribeForm } from './SubscribeForm';
import { FooterBrand } from './FooterBrand';
import axios from 'axios';

const Footer = ({
  scrollContainerRef,
  onCatalogClick,
  onAboutClick,
  onContactClick,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [agree, setAgree] = useState(false);
  const [errorEmail, setErrorEmail] = useState(false);
  const [toast, setToast] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const onEmailChange = useCallback(
    (e) => {
      setEmail(e.target.value);
      if (errorEmail && e.target.value === '') {
        setErrorEmail(false);
        setToast(null);
      }
    },
    [errorEmail]
  );

  const onToggleAgree = useCallback(() => {
    setAgree((prev) => !prev);
  }, []);

  const handleSubscribe = useCallback(async () => {
    if (!isValidEmail(email)) {
      setErrorEmail(true);
      setToast({
        message: 'Пожалуйста, укажите корректный email',
        variant: 'error',
      });
      return;
    }
    if (!agree) return;

    try {
      await axios.post('/api/subscribe', { email, agreed: agree });
      setShowSuccess(true);
      setErrorEmail(false);
      setEmail('');
    } catch (err) {
      setToast({
        message: err.response?.data?.error || 'Ошибка сервера',
        variant: 'error',
      });
    }
  }, [email, agree]);

  const onToastClose = useCallback(() => setToast(null), []);
  const onSuccessClose = useCallback(() => setShowSuccess(false), []);

  const renderLink = createRenderLink(location, navigate, scrollContainerRef, {
    catalog: onCatalogClick,
    about: onAboutClick,
    contact: onContactClick,
  });

  footerLinks.shop.map(renderLink);
  footerLinks.contacts.map(renderExternalLink);

  return (
    <>
      <footer className="font-arial bg-[#141414] text-white text-sm py-6 px-4 md:p-footer">
        <div>
          <img
            src={logo}
            alt="Resego"
            className="w-[65px] md:w-[157px] mx-auto md:mx-0 mb-8 object-contain"
          />
          <SubscribeForm
            variant="mobile"
            email={email}
            agree={agree}
            errorEmail={errorEmail}
            toast={toast}
            showSuccess={showSuccess}
            onEmailChange={onEmailChange}
            onToggleAgree={onToggleAgree}
            onSubmit={handleSubscribe}
            onToastClose={onToastClose}
            onSuccessClose={onSuccessClose}
            containerClass="flex md:hidden flex-col gap-3 w-full"
          />

          <div className="flex md:flex-wrap justify-between items-start md:items-stretch w-full md:w-auto md:gap-12">
            <div className="flex flex-col gap-3 w-[45%] md:w-auto md:gap-6">
              <h4 className="text-[#838383] text-xs md:responsive-heading">
                Магазин
              </h4>
              <div className="flex flex-col text-sm md:responsive-links gap-4 md:gap-8">
                {footerLinks.shop.map(renderLink)}
              </div>
            </div>

            <div className="flex flex-col w-[45%] md:w-auto md:max-w-[220px] md:gap-6 items-end md:items-stretch">
              <h4 className="hidden md:block text-[#838383] responsive-heading">
                Покупателям
              </h4>
              <div className="hidden md:flex flex-col responsive-links gap-8">
                {footerLinks.buyers.map(renderLink)}
              </div>
              <div className="flex md:hidden flex-col text-sm gap-3">
                <span className="text-[#838383] text-xs">Покупателям</span>
                <div className="flex flex-col gap-4">
                  {footerLinks.buyers.map(renderLink)}
                </div>
              </div>
            </div>

            <div className="hidden md:flex flex-col gap-6">
              <h4 className="text-[#838383] responsive-heading">Контакты</h4>
              <div className="flex flex-col responsive-links gap-8">
                {footerLinks.contacts.map(renderExternalLink)}
              </div>
            </div>

            <SubscribeForm
              variant="desktop"
              email={email}
              agree={agree}
              errorEmail={errorEmail}
              toast={toast}
              showSuccess={showSuccess}
              onEmailChange={onEmailChange}
              onToggleAgree={onToggleAgree}
              onSubmit={handleSubscribe}
              onToastClose={onToastClose}
              onSuccessClose={onSuccessClose}
              containerClass="hidden md:flex flex-col gap-3 responsive-width responsive-links"
            />
          </div>
          <div className="flex md:hidden flex-col mt-4 gap-3">
            <h4 className="text-[#838383] text-xs">Контакты</h4>
            <div className="flex flex-col text-sm gap-4">
              {footerLinks.contacts_mobile.map(renderExternalLink)}
            </div>
          </div>
        </div>

        <FooterBrand
          onScrollToTop={() => {
            navigate('/');
            const c = scrollContainerRef?.current ?? window;
            c.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      </footer>

      {toast && (
        <Toast
          message={toast.message}
          variant={toast.variant}
          onClose={() => setToast(null)}
        />
      )}

      {showSuccess && <SuccessModal onClose={() => setShowSuccess(false)} />}
    </>
  );
};

export default React.memo(Footer);
