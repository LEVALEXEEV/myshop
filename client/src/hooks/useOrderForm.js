import { useReducer, useEffect, useCallback } from 'react';
import { isValidEmail, isValidPhone } from '../utils/validators';
import axios from 'axios';

const ACTIONS = {
  INIT: 'init',
  CHANGE_FIELD: 'change_field',
  TOGGLE_REMEMBER: 'toggle_remember',
  VALIDATE: 'validate',
  RESET_ON_CLOSE: 'reset_on_close',
  APPLY_PROMO_START: 'apply_promo_start',
  APPLY_PROMO_SUCCESS: 'apply_promo_success',
  APPLY_PROMO_FAILURE: 'apply_promo_failure',
};

function reducer(state, action) {
  switch (action.type) {
    case ACTIONS.INIT:
      return { ...state, ...action.payload };

    case ACTIONS.CHANGE_FIELD:
      return {
        ...state,
        [action.field]: action.value,
        errors: { ...state.errors, [action.field]: false },
      };

    case ACTIONS.TOGGLE_REMEMBER:
      return { ...state, remember: action.value };

    case ACTIONS.VALIDATE:
      return {
        ...state,
        errors: {
          fullName: state.fullName.trim() === '',
          email: !isValidEmail(state.email.trim()),
          phone: !isValidPhone(state.phone),
          shippingMethod: state.shippingMethod === '',
          agreePolicy: !state.agreePolicy,
          deliveryAddress:
            state.shippingMethod === 'map' && !state.deliveryAddress,
        },
      };

    case ACTIONS.RESET_ON_CLOSE:
      return {
        ...state,
        promo: '',
        discount: 0,
        promoError: '',
        isCheckingPromo: false,
        ...(state.remember
          ? {}
          : {
              fullName: '',
              email: '',
              phone: '',
              shippingMethod: '',
              deliveryAddress: null,
            }),
      };

    case ACTIONS.APPLY_PROMO_START:
      return { ...state, isCheckingPromo: true, promoError: '' };

    case ACTIONS.APPLY_PROMO_SUCCESS:
      return {
        ...state,
        isCheckingPromo: false,
        discount: action.discount,
        promoError: '',
      };

    case ACTIONS.APPLY_PROMO_FAILURE:
      return {
        ...state,
        isCheckingPromo: false,
        discount: 0,
        promoError: action.error,
      };

    default:
      return state;
  }
}

export function useOrderForm(storageKey) {
  const raw = localStorage.getItem(storageKey);
  let saved = null;
  try {
    saved = raw ? JSON.parse(raw) : null;
  } catch {}

  const [state, dispatch] = useReducer(reducer, {
    fullName: saved?.fullName || '',
    email: saved?.email || '',
    phone: saved?.phone || '',
    shippingMethod: saved?.shippingMethod || '',
    deliveryAddress: saved?.deliveryAddress || null,
    remember: saved !== null,
    promo: '',
    discount: 0,
    promoError: '',
    isCheckingPromo: false,
    agreePolicy: false,
    errors: {
      fullName: false,
      email: false,
      phone: false,
      agreePolicy: false,
      shippingMethod: false,
      deliveryAddress: false,
    },
  });

  useEffect(() => {
    if (state.remember) {
      const toSave = {
        fullName: state.fullName,
        email: state.email,
        phone: state.phone,
        shippingMethod: state.shippingMethod,
        deliveryAddress: state.deliveryAddress,
      };
      localStorage.setItem(storageKey, JSON.stringify(toSave));
    } else {
      localStorage.removeItem(storageKey);
    }
  }, [
    storageKey,
    state.remember,
    state.fullName,
    state.email,
    state.phone,
    state.shippingMethod,
    state.deliveryAddress,
  ]);

  const changeField = useCallback((field, value) => {
    dispatch({ type: ACTIONS.CHANGE_FIELD, field, value });
  }, []);

  const toggleRemember = useCallback((value) => {
    dispatch({ type: ACTIONS.TOGGLE_REMEMBER, value });
  }, []);

  const validate = useCallback(() => {
    dispatch({ type: ACTIONS.VALIDATE });
  }, []);

  const resetOnClose = useCallback(() => {
    dispatch({ type: ACTIONS.RESET_ON_CLOSE });
  }, []);

  const applyPromo = useCallback(async () => {
    if (!state.promo) return;
    dispatch({ type: ACTIONS.APPLY_PROMO_START });
    try {
      const res = await axios.get(`/api/promos/${state.promo}`);
      dispatch({
        type: ACTIONS.APPLY_PROMO_SUCCESS,
        discount: res.data.discount_percent,
      });
    } catch (e) {
      dispatch({
        type: ACTIONS.APPLY_PROMO_FAILURE,
        error: e.response?.data?.error || 'Неверный код',
      });
    }
  }, [state.promo]);

  return {
    form: state,
    actions: {
      changeField,
      toggleRemember,
      validate,
      resetOnClose,
      applyPromo,
    },
  };
}
