import { useEffect, useCallback, memo } from 'react';
import 'react-phone-input-2/lib/style.css';
import { useCart } from '../../context/CartContext';
import axios from 'axios';
import { useOrderForm } from '../../hooks/useOrderForm';
import { useModalAnimation } from '../../hooks/useModalAnimation';
import { OrderForm } from './OrderForm';
import { OrderItems } from './OrderItems';
import { ModalHeader } from './ModalHeader';
import { useModal } from '../../context/ModalContext';

const OrderModal = ({ visible, onClose }) => {
  const { closing: isClosing, close: closeAnimation } = useModalAnimation(
    visible,
    onClose
  );
  const { cart, updateQuantity, removeFromCart, clearCart } = useCart();
  const total = cart.reduce((sum, p) => sum + p.price * p.quantity, 0);
  const { open: openModalContext, close: closeModalContext } = useModal();

  const STORAGE_KEY = 'orderFormContacts';
  const { form, actions } = useOrderForm(STORAGE_KEY);
  const {
    fullName,
    email,
    phone,
    shippingMethod,
    deliveryAddress,
    remember,
    promo,
    discount,
    promoError,
    isCheckingPromo,
    agreePolicy,
    errors,
  } = form;
  const { changeField, toggleRemember, validate, resetOnClose, applyPromo } =
    actions;

  useEffect(() => {
    if (!visible) {
      resetOnClose();
    }
  }, [visible, resetOnClose]);

  useEffect(() => {
    if (visible) openModalContext();
    else closeModalContext();
  }, [visible, openModalContext, closeModalContext]);

  const handleChangeShipping = useCallback(
    (e) => changeField('shippingMethod', e.target.value),
    [changeField]
  );

  const handleSubmit = useCallback(() => {
    validate();
    const hasError = Object.values(form.errors).some(Boolean);
    if (hasError) return;

    const payload = {
      full_name: fullName,
      email,
      phone,
      shipping_method: shippingMethod,
      promo: discount ? promo : null,
      items: cart.map(({ id, selectedSize, quantity }) => ({
        id,
        selectedSize,
        quantity,
      })),
      agree_policy: agreePolicy,
    };
    if (shippingMethod === 'map') {
      if (!deliveryAddress || !deliveryAddress.address) {
        validate();
        return;
      }
      payload.address = deliveryAddress.address;
      payload.coords = deliveryAddress.coords;
    }

    axios
      .post('/api/orders', payload)
      .then((res) => {
        clearCart();
        window.location.href = res.data.confirmationUrl;
      })
      .catch((err) => {
        console.error(
          'Ошибка при сохранении заказа:',
          err.response?.data?.error || err.message || 'неизвестная ошибка'
        );
      });
  }, [
    validate,
    form.errors,
    fullName,
    email,
    phone,
    shippingMethod,
    deliveryAddress,
    discount,
    promo,
    cart,
    agreePolicy,
    clearCart,
    onClose,
  ]);

  if (!visible && !isClosing) return null;

  return (
    <div
      className={`
            fixed inset-0 z-50 bg-white overflow-auto
            ${isClosing ? 'animate-modalExit' : 'animate-modalEnter'}
          `}
    >
      <ModalHeader
        title="Оформление заказа"
        onClose={closeAnimation}
        showBack={visible && !isClosing}
      />

      <div className="md:mt-12 flex flex-col-reverse md:flex-row mb-24 md:mb-[148px] md:mx-auto w-full md:max-w-[1200px]">
        <OrderForm
          fullName={fullName}
          phone={phone}
          email={email}
          shippingMethod={shippingMethod}
          deliveryAddress={deliveryAddress}
          promo={promo}
          discount={discount}
          promoError={promoError}
          isCheckingPromo={isCheckingPromo}
          agreePolicy={agreePolicy}
          remember={remember}
          errors={errors}
          changeField={changeField}
          toggleRemember={toggleRemember}
          applyPromo={applyPromo}
          handleSubmit={handleSubmit}
          handleChangeShipping={handleChangeShipping}
          total={total}
        />
        <OrderItems
          cart={cart}
          updateQuantity={updateQuantity}
          removeFromCart={removeFromCart}
          discount={discount}
        />
      </div>
    </div>
  );
};

export default memo(OrderModal);
