import { useSearchParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios from 'axios';

export default function PaymentResult() {
  const [params] = useSearchParams();
  const orderId = params.get('order');
  const [status, setStatus] = useState('loading');
  const [initialTelegram, setInitialTelegram] = useState(null);

  useEffect(() => {
    if (!orderId) return;
    const fetchStatus = async () => {
      try {
        const { data } = await axios.get(`/api/orders/${orderId}`);
        setStatus(data.status);
        setInitialTelegram(data.telegram);
        if (data.status === 'pending') {
          setTimeout(fetchStatus, 4000);
        }
      } catch {
        setStatus('error');
      }
    };
    fetchStatus();
  }, [orderId]);

  if (status === 'loading' || status === 'pending') {
    return (
      <div className="flex flex-col items-center mt-24 px-4">
        <h1 className="text-2xl font-semibold mb-4">Обработка платежа…</h1>
        <p className="text-gray-600 text-justify md:text-center text-align-last-left-mobile">
          Пожалуйста, не закрывайте страницу.
        </p>
      </div>
    );
  }

  if (status === 'paid') {
    return <PaidScreen orderId={orderId} initialTelegram={initialTelegram} />;
  }

  if (status === 'cancelled') {
    return (
      <div className="flex flex-col items-center mt-24 px-4">
        <h1 className="text-2xl font-semibold text-orange-500 mb-4">
          Заказ отменён.
        </h1>
        <p
          className="text-gray-600 mb-4 text-justify md:text-center text-align-last-left-mobile"
        >
          Заказ автоматически отменён. Вы можете оформить новый.
        </p>
        <Link
          to="/"
          className="flex items-center justify-center w-full md:w-auto bg-black hover:bg-[#333] h-12 text-white px-6 rounded font-semibold text-sm uppercase transition duration-200"
        >
          Вернуться в магазин
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center mt-24 px-4">
      <h1 className="text-2xl font-semibold text-red-600 mb-4">
        Не удалось подтвердить платёж
      </h1>
      <p
        className="text-gray-600 mb-4 text-justify md:text-center text-align-last-left-mobile"
      >
        Если деньги списались — мы уведомим вас по почте.
      </p>
      <Link
        to="/"
        className="flex items-center justify-center w-full md:w-auto bg-black hover:bg-[#333] h-12 text-white px-6 rounded font-semibold text-sm uppercase transition duration-200"
      >
        Вернуться в магазин
      </Link>
    </div>
  );
}

function PaidScreen({ orderId, initialTelegram }) {
  const [telegram, setTelegram] = useState(initialTelegram || '');
  const [saved, setSaved] = useState(!!initialTelegram);
  const [error, setError] = useState('');

  const saveTg = async () => {
    setError('');
    try {
      await axios.patch(`/api/orders/${orderId}/telegram`, { telegram });
      setSaved(true);
    } catch (e) {
      setError(e.response?.data?.error || 'Ошибка сохранения');
    }
  };

  return (
    <div className="flex flex-col items-center mt-24 max-w-xl mx-auto gap-6 px-4 md:px-0">
      <h1 className="text-2xl font-semibold text-emerald-600 text-center">
        Спасибо! Оплата прошла успешно.
      </h1>

      <p
        className="text-gray-500 text-base text-justify md:text-center text-align-last-left-mobile"
      >
        Если вы не получите сообщение от менеджера из‑за приватных настроек в Telegram, можете написать напрямую:{' '}
        <a
          href="https://t.me/resego_manager"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#ff8562] focus:outline-none active:text-[#cc5a50]"
        >
          @resego_manager
        </a>
      </p>

      {!saved && (
        <>
          <label className="w-full text-sm text-gray-700">
            Ваш Telegram для связи:
            <input
              className="mt-2 w-full border border-gray-300 rounded px-3 py-2 text-base focus:ring-2 focus:ring-[#ff8562] focus:border-transparent"
              placeholder="@username"
              value={telegram}
              onChange={(e) => setTelegram(e.target.value)}
            />
          </label>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button
            onClick={saveTg}
            className="bg-[#ff8562] hover:bg-[#e06b4f] active:bg-[#cc5a50] text-white px-6 py-2 rounded transition-colors duration-200"
          >
            Сохранить
          </button>
        </>
      )}

      {saved && (
        <>
          <p className="text-emerald-600 text-base text-center">
            Ваш Telegram сохранён. Спасибо!
          </p>
          <p
            className="text-gray-500 text-base text-justify md:text-center text-align-last-left-mobile"
          >
            Если вы не получили уведомление от менеджера в течение 5 минут, напишите ему напрямую:{' '}
            <a
              href="https://t.me/resego_manager"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#ff8562] focus:outline-none active:text-[#cc5a50]"
            >
              @resego_manager
            </a>
          </p>
        </>
      )}

      <Link
        to="/"
        className="mt-6 w-full md:w-auto text-center bg-black hover:bg-gray-800 active:bg-gray-900 text-white px-5 py-3 rounded font-semibold text-sm uppercase transition-colors duration-200"
      >
        На главную
      </Link>
    </div>
  );
}
