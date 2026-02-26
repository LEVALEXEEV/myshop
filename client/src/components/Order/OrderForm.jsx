import { memo, useCallback } from 'react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { AddressSelector } from './AddressSelector';

const SHIPPING_OPTIONS = [{ value: 'map', label: 'Выбрать пункт СДЭК' }];

function OrderFormComponent({
  fullName,
  phone,
  email,
  shippingMethod,
  deliveryAddress,
  promo,
  discount,
  promoError,
  isCheckingPromo,
  agreePolicy,
  remember,
  errors,
  changeField,
  toggleRemember,
  applyPromo,
  handleSubmit,
  handleChangeShipping,
  total,
}) {
  const handleAddressSelect = useCallback(
    ({ coords, address }) => {
      changeField('deliveryAddress', { coords, address });
    },
    [changeField]
  );

  return (
    <form className="md:w-full md:sticky md:top-20 md:self-start md:max-w-[560px] mx-4 md:mx-5">
      <div className="md:grid md:grid-cols-2 md:gap-x-[15px] md:mb-[35px]">
        <div className="mb-[35px] md:mb-0">
          <input
            type="text"
            placeholder="Ваши ФИО"
            value={fullName}
            spellCheck={false}
            onChange={(e) => changeField('fullName', e.target.value)}
            className={`
              w-full h-[55px] outline-none placeholder:text-base border-b
              ${
                errors.fullName
                  ? 'px-2 border border-red-500'
                  : 'border-[rgba(0,0,0,0.6)]'
              }
            `}
          />
          {errors.fullName && (
            <div className="text-red-500 text-xs mt-1">
              Обязательно для заполнения
            </div>
          )}
        </div>

        <div className="mb-[35px] md:mb-0">
          <PhoneInput
            country="ru"
            value={phone}
            onChange={(val) => changeField('phone', val)}
            containerClass={`react-tel-input w-full ${
              errors.phone ? 'phone-error' : ''
            }`}
            containerStyle={{ width: '100%' }}
            inputStyle={{
              height: '55px',
              border: 'none',
              outline: 'none',
              fontSize: '16px',
              width: '100%',
              backgroundColor: 'transparent',
            }}
            buttonStyle={{
              border: 'none',
              backgroundColor: 'transparent',
              boxShadow: 'none',
              padding: 0,
              margin: 0,
            }}
            dropdownStyle={{ zIndex: 9999 }}
            countryCodeEditable={false}
          />
          {errors.phone && (
            <div className="text-red-500 text-xs mt-1">
              {phone.trim() === ''
                ? 'Обязательно для заполнения'
                : 'Введите корректный номер'}
            </div>
          )}
        </div>
      </div>

      <div className="mb-[40px]">
        <input
          type="email"
          placeholder="E-mail"
          value={email}
          spellCheck={false}
          onChange={(e) => changeField('email', e.target.value)}
          className={`
            w-full h-[55px] outline-none placeholder:text-base border-b
            ${
              errors.email
                ? 'px-2 border border-red-500'
                : 'border-[rgba(0,0,0,0.6)]'
            }
          `}
        />
        {errors.email && (
          <div className="text-red-500 text-xs mt-1">
            {email.trim() === ''
              ? 'Обязательно для заполнения'
              : 'Некорректный формат e-mail'}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2.5 mb-[35px]">
        {SHIPPING_OPTIONS.map(({ value, label }) => (
          <label
            key={value}
            className="
              flex items-center text-xs md:text-sm font-light rounded cursor-pointer
              transition-colors
            "
          >
            <input
              type="radio"
              name="shipping"
              value={value}
              checked={shippingMethod === value}
              onChange={handleChangeShipping}
              className="
                mr-3 box-border -mt-[1px] md:mt-0 h-5 w-5 cursor-pointer
                appearance-none rounded-full border-2 border-[rgba(0,0,0,0.6)]
                checked:bg-black checked:border-black transition-all duration-200
              "
              style={{ boxShadow: 'inset 0 0 0 2px white' }}
            />
            {label}
          </label>
        ))}
        {errors.shippingMethod && (
          <div className="text-red-500 text-xs">
            Обязательно выбрать способ доставки
          </div>
        )}
      </div>

      {shippingMethod === 'map' && (
        <div className="mb-[35px]">
          <AddressSelector
            initialCoords={deliveryAddress?.coords}
            onSelect={handleAddressSelect}
            hasError={!!errors.deliveryAddress}
          />
          {deliveryAddress?.address?.trim() && (
            <div className="mt-2 text-base">
              Выбран адрес: <strong>{deliveryAddress.address}</strong>
            </div>
          )}
        </div>
      )}

      <div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Промокод, если есть"
            value={promo}
            spellCheck={false}
            onChange={(e) => changeField('promo', e.target.value.toUpperCase())}
            className="flex-grow border-b h-[55px] outline-none placeholder:text-base"
          />
          <button
            type="button"
            onClick={applyPromo}
            disabled={isCheckingPromo}
            className="
              box-border px-4 py-2 cursor-pointer text-white bg-black font-bold
              rounded-sm hover:bg-[#333] transition-all duration-200
            "
          >
            {isCheckingPromo ? 'Применить' : 'Применить'}
          </button>
        </div>
        {promoError && (
          <div className="text-red-500 text-sm mt-2">{promoError}</div>
        )}
        {discount > 0 && (
          <div className="text-green-600 text-sm mt-2">
            Скидка: {discount}% ({((total * discount) / 100).toLocaleString()}{' '}
            р.)
          </div>
        )}
      </div>

      <div className="mt-[35px]">
        <label
          className={`
          flex items-start text-xs md:text-sm font-light cursor-pointer gap-2
          ${errors.agreePolicy ? 'p-2 border border-red-500' : 'border-0'}
        `}
        >
          <div className="relative w-[26px] h-[26px] shrink-0">
            <input
              type="checkbox"
              checked={agreePolicy}
              onChange={() => changeField('agreePolicy', !agreePolicy)}
              className="peer absolute w-full h-full opacity-0 cursor-pointer"
            />
            <span
              className="
              block scale-75 w-full h-full border-2 border-[rgba(0,0,0,0.6)]
              peer-checked:border-black transition-all duration-200
            "
            />
            <span
              className="
              absolute top-1/2 left-1/2 w-[6px] h-[13px]
              -translate-x-1/2 -translate-y-[60%]
              border-r-[2px] border-b-[2px] border-[#7d7d7d]
              peer-checked:border-black rotate-45 hidden peer-checked:block
              transition-colors duration-200
            "
            />
          </div>
          <span className="leading-[16px]">
            Нажимая кнопку отправить, Вы соглашаетесь с политикой
            конфиденциальности данных.
          </span>
        </label>
        {errors.agreePolicy && (
          <div className="text-red-500 text-xs mt-1">
            Обязательно для заполнения
          </div>
        )}
      </div>

      <label
        className="
        flex items-center text-xs md:text-sm font-light cursor-pointer
        mt-[20px] mb-[35px] gap-2
      "
      >
        <div className="relative w-[26px] h-[26px] shrink-0">
          <input
            type="checkbox"
            checked={remember}
            onChange={() => toggleRemember(!remember)}
            className="peer absolute w-full h-full opacity-0 cursor-pointer"
          />
          <span
            className="
            block scale-75 w-full h-full border-2 border-[rgba(0,0,0,0.6)]
            peer-checked:border-black transition-all duration-200
          "
          />
          <span
            className="
            absolute top-1/2 left-1/2 w-[6px] h-[13px]
            -translate-x-1/2 -translate-y-[60%]
            border-r-[2px] border-b-[2px] border-[#7d7d7d]
            peer-checked:border-black rotate-45 hidden peer-checked:block
            transition-colors duration-200
          "
          />
        </div>
        <span>Запомнить контакты для повторной покупки</span>
      </label>

      <div className="md:hidden pb-[35px] px-4 text-right font-semibold">
        {discount > 0 ? (
          <>
            <div className="line-through opacity-50">
              {total.toLocaleString()} р.
            </div>
            <div>
              Итого:{' '}
              {Math.round((total * (100 - discount)) / 100).toLocaleString()} р.
            </div>
          </>
        ) : (
          <>Сумма: {total.toLocaleString()} р.</>
        )}
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        className="
          md:mt-4 box-border cursor-pointer text-base h-[60px] w-full
          bg-black text-white py-3 uppercase rounded-sm font-bold
          hover:bg-[#333] transition-all duration-200
        "
        style={{ fontFamily: 'Arial' }}
      >
        Оформить заказ
      </button>
    </form>
  );
}

export const OrderForm = memo(OrderFormComponent);
