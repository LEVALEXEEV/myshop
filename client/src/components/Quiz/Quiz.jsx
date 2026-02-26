import { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { QUESTIONS } from '../../constants/quizQuestions';

export default function Quiz() {
  const [step, setStep] = useState(0);
  const [promo, setPromo] = useState(null);
  const [blocked, setBlocked] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const [isClosing, setIsClosing] = useState(false);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('quizData') || '{}');
    if (saved.code && saved.expiresAt > Date.now()) {
      setPromo(saved.code);
      setBlocked(true);
      setStep(QUESTIONS.length - 1);
      return;
    }
    fetch('/api/promos/check', { headers: { 'X-UA': navigator.userAgent } })
      .then((r) =>
        r.status === 204 ? null : r.ok ? r.json() : Promise.reject(r.status)
      )
      .then((body) => {
        if (body?.code) {
          const expiresAt = new Date(body.expires_at).getTime();
          localStorage.setItem(
            'quizData',
            JSON.stringify({
              code: body.code,
              expiresAt,
              discount_percent: body.discount_percent,
            })
          );
          setPromo(body.code);
          setBlocked(true);
          setStep(QUESTIONS.length - 1);
        }
      })
      .catch(console.error);
  }, []);

  const handleOptionClick = (index) => {
    setSelected(index);
  };

  const generatePromo = async () => {
    try {
      const resp = await fetch('/api/promos/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (resp.status === 409) {
        const { code: existingCode, expires_at } = await resp.json();
        localStorage.setItem(
          'quizData',
          JSON.stringify({
            code: existingCode,
            expiresAt: new Date(expires_at).getTime(),
          })
        );
        setPromo(existingCode);
        setBlocked(true);
        return;
      }
      if (!resp.ok) throw resp;
      const { code, discount_percent, expires_at } = await resp.json();
      localStorage.setItem(
        'quizData',
        JSON.stringify({
          code,
          expiresAt: new Date(expires_at).getTime(),
          discount_percent,
        })
      );
      setPromo(code);
      setBlocked(true);
    } catch (err) {
      console.error('Не удалось получить промокод:', err);
    }
  };

  const handleNext = async () => {
    if (step + 1 < QUESTIONS.length) {
      const next = step + 1;
      setStep(next);
      setSelected(null);
      localStorage.setItem('quizStep', next);
    } else {
      await generatePromo();
    }
  };

  const portalRoot = document.getElementById('portal-root');
  if (!portalRoot || !isOpen) return null;

  const closeQuiz = () => {
    setIsClosing(true);
    setTimeout(() => setIsOpen(false), 300);
  };

  const progress = blocked
    ? 100
    : Math.round(((step + 1) / QUESTIONS.length) * 100);

  const current = QUESTIONS[step];
  const isCorrect = selected === current.answer;

  const cardContent =
    blocked && promo ? (
      <>
        <h2 className="text-xl md:text-3xl font-bold text-white mb-4 text-neon">
          Спасибо за участие!
        </h2>
        <p className="text-base md:text-lg text-gray-300 mb-2">
          Ваш промокод: <span className="font-mono text-neon">{promo}</span>
        </p>
        <p className="text-sm text-gray-500">
          Действует до:{' '}
          {(() => {
            try {
              const saved = JSON.parse(
                localStorage.getItem('quizData') || '{}'
              );
              return new Date(saved.expiresAt).toLocaleString();
            } catch {
              return '—';
            }
          })()}
        </p>
      </>
    ) : (
      <>
        <h2 className="text-xl md:text-3xl font-bold text-white mb-4 text-neon">
          Спортивная викторина: Москва-1980!
        </h2>
        <p className="text-white mb-6 text-sm md:text-base">
          <span className="text-neon">{step + 1}</span>. {current.text}
        </p>
        <div className="grid gap-3 md:gap-4">
          {current.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => handleOptionClick(i)}
              className={`quiz-btn ${
                selected !== null
                  ? i === current.answer
                    ? 'correct'
                    : i === selected
                    ? 'wrong'
                    : ''
                  : ''
              }`}
              disabled={selected !== null}
            >
              <span className="mr-2 text-neon">
                {String.fromCharCode(0x410 + i)}){' '}
              </span>
              {opt}
            </button>
          ))}
        </div>
        {selected !== null && (
          <div className="mt-4">
            <p
              className={`text-sm md:text-base font-semibold ${
                isCorrect ? 'text-green-400' : 'text-red-400'
              }`}
            >
              {isCorrect
                ? 'Правильно!'
                : `Неверно. Правильный ответ: ${
                    current.options[current.answer]
                  }`}
            </p>
            {current.image && (
              <div className="mt-3">
                <div className="flex justify-center">
                  <img
                    src={`/api/quiz/images/${current.image}`}
                    alt=""
                  />
                </div>
                {current.description && (
                  <p
                    className="mt-2 text-sm md:text-base text-gray-300"
                    style={{ textAlign: 'justify', textJustify: 'inter-word' }}
                  >
                    {current.description}
                  </p>
                )}
              </div>
            )}
            <button onClick={handleNext} className="mt-6 quiz-btn">
              {step + 1 < QUESTIONS.length ? 'Далее' : 'Получить промокод'}
            </button>
          </div>
        )}
        <p className="mt-6 text-gray-500 text-sm">
          Вопрос {step + 1} из {QUESTIONS.length}
        </p>
      </>
    );

  return ReactDOM.createPortal(
    <div
      className={`fixed inset-0 z-60 quiz-overlay ${
        isClosing ? 'animate-fadeOut' : 'animate-fadeIn'
      }`}
      onClick={closeQuiz}
    >
      <button
        onClick={closeQuiz}
        aria-label="Закрыть викторину"
        className="quiz-close"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-7 h-7 md:w-8 md:h-8 text-neon"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={3}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
      <div className="quiz-container">
        <div
          className={`quiz-card ${
            isClosing ? 'animate-fadeOutUp' : 'animate-fadeInUp'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="quiz-progress">
            <div
              className="quiz-progress__bar"
              style={{ width: `${progress}%` }}
            />
          </div>
          {cardContent}
        </div>
      </div>
    </div>,
    portalRoot
  );
}
