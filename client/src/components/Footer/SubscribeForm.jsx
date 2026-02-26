import React from 'react';
import Toast from '../ui/Toast';
import SuccessModal from './SuccessModal';

export const SubscribeForm = React.memo(
  ({
    email,
    agree,
    errorEmail,
    toast,
    showSuccess,
    onEmailChange,
    onToggleAgree,
    onSubmit,
    onToastClose,
    onSuccessClose,
    containerClass = '',
    variant = 'desktop',
  }) => {
    const isDesktop = variant === 'desktop';

    const pClass = isDesktop
      ? 'uppercase font-medium text-white responsive-subscribe tracking-normal-[-0.2px] mb-1'
      : 'uppercase font-medium text-white text-base leading-[22px] max-w-[80%] tracking-normal-[-0.2px]';

    const inputClass = `
      peer w-full bg-transparent placeholder-transparent text-white
      focus:outline-none pb-2 border-b
      ${isDesktop ? 'responsive-links' : ''}
      ${
        errorEmail ? 'border border-red-500 pt-6 pl-4' : 'border-[#868686] pt-4'
      }
    `;

    const labelClass = `
      absolute top-3 cursor-auto text-[#868686] font-medium
      ${
        isDesktop
          ? 'responsive-links transition-all duration-250'
          : 'transition-all duration-250'
      }
      pointer-events-none
      peer-placeholder-shown:top-3 peer-focus:top-[-8px]
      peer-focus:${isDesktop ? 'text-sm' : 'text-xs'}
      peer-not-placeholder-shown:top-[-8px]
      peer-not-placeholder-shown:${isDesktop ? 'text-sm' : 'text-xs'}
      ${
        errorEmail
          ? 'left-4 peer-placeholder-shown:top-4 peer-focus:top-[2px] peer-not-placeholder-shown:top-[2px]'
          : 'left-0'
      }
    `;

    const buttonClass = `
      bg-white text-black
      ${
        isDesktop
          ? 'responsive-width aspect-[8/1] responsive-links rounded-sm'
          : 'w-full h-[48px] rounded-sm text-[15px] mb-10'
      }
      cursor-pointer font-semibold mt-2 transition-all duration-200 select-none
      ${!agree ? 'opacity-50 pointer-events-none' : 'hover:bg-[#f0f0f0]'}
    `;

    const checkboxWrapperClass = [
      'flex items-start gap-3 font-light mt-2 leading-snug cursor-pointer',
      isDesktop ? 'responsive-links' : 'text-sm',
    ].join(' ');

    return (
      <>
        <div className={containerClass}>
          <p className={pClass}>
            Подпишитесь на нашу e-mail рассылку, чтобы первыми увидеть новые
            коллекции, новости и видео
          </p>

          <div className="relative w-full">
            <input
              type="email"
              id="email"
              value={email}
              onChange={onEmailChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  onSubmit();
                }
              }}
              placeholder="E-mail"
              className={inputClass}
            />
            <label htmlFor="email" className={labelClass}>
              E-mail
            </label>
          </div>

          <label className={checkboxWrapperClass}>
            <div className="relative w-[26px] h-[26px] flex-shrink-0">
              <input
                type="checkbox"
                checked={agree}
                onChange={onToggleAgree}
                className="peer absolute w-full h-full opacity-0 cursor-pointer"
              />
              <span
                className="block w-full h-full border-[3px] border-[#7d7d7d]
                             opacity-60 peer-checked:opacity-100 transition-opacity duration-150"
              />
              <span
                className="absolute top-1/2 left-1/2 w-[6px] h-[13px]
                             -translate-x-1/2 -translate-y-[60%] border-r-[3px] border-b-[3px]
                             border-[#7d7d7d] rotate-45 hidden peer-checked:block"
              />
            </div>
            <span>
              Нажимая кнопку отправить, Вы соглашаетесь
              <br />с условиями политики конфиденциальности данных.
            </span>
          </label>

          <button onClick={onSubmit} disabled={!agree} className={buttonClass}>
            ПОДПИСАТЬСЯ
          </button>
        </div>

        {toast && (
          <Toast
            message={toast.message}
            variant={toast.variant}
            onClose={onToastClose}
          />
        )}
        {showSuccess && <SuccessModal onClose={onSuccessClose} />}
      </>
    );
  }
);
