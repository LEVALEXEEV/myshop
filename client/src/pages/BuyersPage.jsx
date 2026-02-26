import { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar/Navbar';
import Footer from '../components/Footer/Footer';
import Quiz from '../components/Quiz/Quiz';
import Lottie from 'lottie-react';
import giftAnim from '../assets/animations/gift.json';
import { useCart } from '../context/CartContext';
import { useFavorites } from '../context/FavoritesContext';
import { useModal } from '../context/ModalContext';

const tabItems = [
  { id: 'about', label: 'О БРЕНДЕ' },
  { id: 'delivery', label: 'ДОСТАВКА И ОПЛАТА' },
  { id: 'returns', label: 'ОБМЕН И ВОЗВРАТ' },
  { id: 'care', label: 'СОСТАВ И УХОД' },
  { id: 'requisites', label: 'РЕКВИЗИТЫ' },
];

const BuyersPage = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('about');

  const { isCartOpen } = useCart();
  const { isFavoritesOpen } = useFavorites();
  const { isAnyModalOpen } = useModal();
  const [showQuiz, setShowQuiz] = useState(false);
  const [hover, setHover] = useState(false);
  const lottieRef = useRef(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam && tabItems.some((item) => item.id === tabParam)) {
      setActiveTab(tabParam);
    }
  }, [location.search]);

  useEffect(() => {
    if (lottieRef.current) {
      lottieRef.current.setSpeed(0.5);
    }
  }, [hover]);

  const mainScrollRef = useRef(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam && tabItems.some((item) => item.id === tabParam)) {
      setActiveTab(tabParam);
    }
  }, [location.search]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      {!showQuiz && !isCartOpen && !isFavoritesOpen && !isAnyModalOpen && (
        <button
          onClick={() => setShowQuiz(true)}
          aria-label="Пройти викторину"
          className={`
            hidden top-[90px] right-6 z-50
            bg-[hsla(0,0%,100%,.8)] shadow-[0_2px_3px_rgba(0,11,48,0.25)]
            overflow-hidden rounded-full
            transition-all duration-200
            ${hover ? 'w-28 h-28' : 'w-20 h-20 md:w-24 md:h-24'}
          `}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
        >
          <Lottie
            lottieRef={lottieRef}
            animationData={giftAnim}
            autoplay
            loop={hover}
            style={{ marginLeft: '-5px', width: '110%', height: '110%' }}
          />
        </button>
      )}

      <div
        ref={mainScrollRef}
        className="relative z-20 flex-1 overflow-y-auto scroll-container scroll-fade-in transition-opacity duration-300"
      >
        <Navbar scrollContainerRef={mainScrollRef} />

        <div className="w-full box-border px-[5vw] max-w-[1320px] mx-auto font-arial">
          <div className="hidden md:grid grid-cols-5 text-center border-b border-b-[#eee] mt-8">
            {tabItems.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`uppercase cursor-pointer text-sm tracking-[-0.3px] pb-2.5 transition-all
                ${
                  activeTab === tab.id
                    ? 'text-black font-bold border-b border-black'
                    : 'text-[#c2c2c2] font-normal hover:text-black transition-all duration-150'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="md:hidden mt-6 relative w-full font-arial">
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value)}
              className={`
                w-full h-[51px] border border-black px-5
                text-base uppercase font-semibold bg-white appearance-none
                rounded-none focus:outline-none focus:ring-0
              `}
            >
              {tabItems.map((tab) => (
                <option key={tab.id} value={tab.id}>
                  {tab.label}
                </option>
              ))}
            </select>

            <div className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2">
              <svg
                width="10"
                height="6"
                viewBox="0 0 10 6"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M1 1L5 5L9 1" stroke="black" strokeWidth="2" />
              </svg>
            </div>
          </div>

          <main className="pt-12 md:pt-[70px] pb-5 md:pb-[40px] px-5">
            {activeTab === 'about' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-20">
                  <div className="place-self-start flex flex-col max-w-[440px] leading-[22px] gap-2 md:gap-6">
                    <h4 className="uppercase font-bold text-[#919191] text-[10px] md:text-xs">
                      ПРЕДЫСТОРИЯ
                    </h4>

                    <div className="text-sm md:text-base leading-[18px] md:leading-[22px]">
                      Меня зовут Ярик. В прошлом — профессиональный спортсмен,
                      мастер спорта по плаванию. Спорт был моим делом жизни. Но
                      в апреле 2023-го я завершил карьеру и шагнул в
                      неизвестность — ту самую неизвестность, где ты сам
                      выбираешь своё направление и сам задаёшь темп.
                    </div>

                    <h4 className="uppercase font-bold text-[#919191] text-[10px] md:text-xs">
                      SWIMMING STUFF
                    </h4>

                    <div className="text-sm md:text-base leading-[18px] md:leading-[22px]">
                      Прошло всего несколько недель. Я устроился тренером в
                      фитнес-клуб, продал старую машину — подарок от брата на
                      18-летие — и вложился в первый проект: бренд уличной
                      одежды для пловцов —<strong>SWIMMING STUFF</strong>. Идея
                      зародилась задолго до этого, но не хватало смелости
                      начать. Помог друг Илья: на одной из ночных прогулок по
                      Питеру я поделился с ним своей задумкой. Он не просто
                      поддержал, а предложил стать частью проекта. Так и
                      появился <strong>SWIMMING STUFF</strong> — первый шаг от
                      спортивного прошлого к новому смыслу.
                    </div>

                    <h4 className="uppercase font-bold text-[#919191] text-[10px] md:text-xs">
                      ПЕРВЫЙ УСПЕХ
                    </h4>

                    <div className="text-sm md:text-base leading-[18px] md:leading-[22px]">
                      С июня по ноябрь 2023 года мы готовились к нашему первому
                      дропу. Без опыта, без наставников — только пробы и ошибки.
                      Помню, как хотели сделать шелкографию на худи, но ткань
                      повела себя иначе: печать съехала, и мы потеряли 30 штук
                      из первой партии.
                      <br />
                      <br />
                      Но <strong>24 ноября 2023</strong> мы всё же выпустили
                      первый дроп. Этот день — навсегда в памяти. О нас
                      заговорили в плавательном комьюнити по всей России. На
                      соревнованиях «Резерв России» почти в каждом финале были
                      наши худи. Это было больше, чем продажи — это было
                      признание, объединение, движ.
                    </div>

                    <h4 className="uppercase font-bold text-[#919191] text-[10px] md:text-xs">
                      ПОЛГОДА СПУСТЯ
                    </h4>

                    <div className="text-sm md:text-base leading-[18px] md:leading-[22px]">
                      Май 2024 — третий дроп. Самый крупный: 4 модели футболок,
                      3 лонгслива, 2 шапочки, шорты. Более 300 единиц.
                      Производство не так поняло ТЗ, и мы получили 150 футболок
                      одного размера вместо четырёх. Без ругани не обошлось, но
                      быстро поняли: конфликт — не решение. Перешли на другое
                      производство, всё переделали. Дроп снова продался
                      полностью.
                    </div>

                    <h4 className="uppercase font-bold text-[#919191] text-[10px] md:text-xs">
                      КОНФЛИКТ И ВЫХОД
                    </h4>

                    <div className="text-sm md:text-base leading-[18px] md:leading-[22px]">
                      Бизнес с другом — это всегда риск. В нашем случае так и
                      вышло. Начались конфликты. Я понял, что не хочу продолжать
                      работать вместе. Честно об этом сказал. Он остался, я
                      вышел, забрал свою часть деньгами и товаром — и ушёл.
                      Почему? Потому что уже тогда в голове родился новый вектор
                      — идея, которая перерастала в нечто большее.
                    </div>

                    <h4 className="uppercase font-bold text-[#919191] text-[10px] md:text-xs">
                      READY. SET. GO.
                    </h4>

                    <div className="text-sm md:text-base leading-[18px] md:leading-[22px]">
                      Сначала я освободился от лишнего: распродал остатки по
                      себестоимости знакомым. Те, кто давно хотел, — наконец
                      получили. А дальше — анализ. Я начал изучать историю
                      настоящих уличных брендов. И понял главное: шмотку сделать
                      может каждый, но дать ей смысл способны единицы. Так и
                      начался <strong>Resego</strong>.
                    </div>

                    <h4 className="uppercase font-bold text-[#919191] text-[10px] md:text-xs">
                      ТЕЛЕГРАМ-КАНАЛ
                    </h4>

                    <div className="text-sm md:text-base leading-[18px] md:leading-[22px]">
                      В декабре 2024 я завёл Telegram-канал со спортивной
                      тематикой. Чтобы успешно продавать вещи аудитории, я
                      должен окружить себя людьми, которые «выкупят» мои идеи.
                      Идея канала — показать лучшие стороны каждого вида спорта
                      и объединить их любителей.{' '}
                      <a
                        href="https://t.me/RESEGO_BRAND"
                        className="text-primary underline"
                      >
                        Подписывайтесь!
                      </a>
                    </div>

                    <h4 className="uppercase font-bold text-[#919191] text-[10px] md:text-xs">
                      DROP 1980
                    </h4>

                    <div className="text-sm md:text-base leading-[18px] md:leading-[22px]">
                      Своим первым дропом я решил сделать футболки к 45-летию
                      Московской домашней Олимпиады. Всего 3 модели:{' '}
                      <strong>BEARBRICK</strong>,{' '}
                      <strong>TYPES OF SPORTS</strong>,{' '}
                      <strong>VLADIMIR</strong>.<br />
                      <br />
                      Суть дропа: ретро-революция в стиле — одежда, которая
                      взрывает ностальгию по Москве-80 и заряжает духом
                      Олимпиады через призму современной моды.
                    </div>
                  </div>

                  <div className="place-self-start text-left flex flex-col max-w-[470px] leading-[22px] gap-2 md:gap-6">
                    <h4 className="uppercase font-bold text-[#919191] text-[10px] md:text-xs">
                      О бренде
                    </h4>

                    <h2 className="font-bold uppercase text-sm md:text-base leading-[20px] md:leading-[22px] align-middle max-w-full md:max-w-[485px]">
                      Миссия Resego – передать дух спорта, дерзости и силы через
                      одежду.
                    </h2>

                    <div className="text-sm md:text-base leading-[18px] md:leading-[22px]">
                      Каждая вещь Resego – это не просто элемент гардероба, а
                      способ заявить о себе: я здесь, чтобы побеждать. Мы
                      создаём одежду для тех, кто живёт в движении, ценит
                      свободу и силу настоящего момента.
                    </div>
                    <div className="text-sm md:text-base leading-[18px] md:leading-[22px]">
                      Надевая футболку с ярким спортивным принтом, ты
                      становишься частью большого сообщества, где у каждого свой
                      ритм, но цель одна: двигаться вперёд, выше, быстрее. Наши
                      дизайны вдохновлены как легендарными моментами спорта, так
                      и культурными кодами современности.
                    </div>
                    <div className="text-sm md:text-base leading-[18px] md:leading-[22px]">
                      Мы верим, что визуальный образ способен отражать
                      внутреннюю уверенность и стремление к победе. Наши принты
                      несут в себе истории, которые мотивируют, а силуэты задают
                      темп. Это одежда для тех, кто не стоит на месте и играет
                      по своим правилам.
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'delivery' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-20">
                <div className="place-self-start flex flex-col max-w-[440px] leading-[22px] gap-2 md:gap-6">
                  <h4 className="uppercase font-bold text-[#919191] text-[10px] md:text-xs">
                    Информация об оплате
                  </h4>

                  <div className="text-sm md:text-base leading-[20px] md:leading-[22px]">
                    <div className="underline">Банковские карты и СБП:</div>
                    <div>
                      Мы принимаем к оплате карты Visa, MasterCard и МИР.
                      <br />
                      Все транзакции защищены и осуществляются через защищённое
                      соединение.
                    </div>
                  </div>

                  <div className="text-sm md:text-base leading-[20px] md:leading-[22px]">
                    <div className="underline">Безопасность платежей:</div>
                    <div>
                      Мы используем современные технологии шифрования для защиты
                      ваших данных. Вся информация о платежах передаётся по
                      защищённому каналу.
                      <br />
                      Данные вашей кредитной карты передаются только в
                      зашифрованном виде и не сохраняются на нашем Web-сервере.
                    </div>
                  </div>
                </div>

                <div className="place-self-start text-left flex flex-col max-w-[470px] leading-[22px] gap-2 md:gap-6">
                  <h4 className="uppercase font-bold text-[#919191] text-[10px] md:text-xs">
                    Информация о доставке
                  </h4>

                  <div className="text-sm md:text-base leading-[20px] md:leading-[22px]">
                    Мы доставляем заказы в любую точку России и мира из г.
                    Санкт-Петербург.
                    <br />
                    Товары отправляются компанией СДЕК.
                  </div>

                  <div className="text-sm md:text-base leading-[20px] md:leading-[22px]">
                    Ежедневно мы работаем над улучшением качества и скорости
                    доставки, поэтому сейчас готовы предложить самые оптимальные
                    условия для вашего комфорта.
                  </div>

                  <div className="text-sm md:text-base leading-[20px] md:leading-[22px]">
                    <div className="underline">Россия</div>
                    <div>
                      Стоимость доставки по России рассчитывается индивидуально,
                      согласно тарифам СДЭК, после подтверждения заказа
                      менеджером и оплачивается отдельно от заказа.
                    </div>
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'returns' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-20">
                <div className="place-self-start flex flex-col max-w-[520px] leading-[22px] gap-2 md:gap-6">
                  <h4 className="uppercase font-bold text-[#919191] text-[10px] md:text-xs">
                    Информация об обмене товара
                  </h4>

                  <div className="text-sm md:text-base leading-[20px] md:leading-[22px]">
                    Обмен товара надлежащего качества на аналогичный товар
                    другого цвета, фасона и пр. или на другой аналогичный товар
                    с доплатой или без в зависимости от разницы суммы покупки
                    можно осуществить предварительно связавшись с нашими
                    менеджерами на почту:{' '}
                    <a
                      href="mailto:resegooff@gmail.com"
                      className="text-[#ff8562]"
                    >
                      RESEGOOFF@GMAIL.COM
                    </a>
                  </div>

                  <div className="text-sm md:text-base leading-[20px] md:leading-[22px]">
                    После согласования всех деталей возврата и состава
                    сопроводительных документов вам будут предоставлены данные
                    для самостоятельной курьерской отправки заказа на наш склад
                    (доставка должна быть осуществлена курьером до двери). Так
                    как возвращаемые товары остаются собственностью и
                    ответственностью покупателя до тех пор, пока не будут
                    получены и осмотрены на предмет сохранения товарного вида на
                    нашем складе, настоятельно рекомендуем упаковывать товар как
                    можно надежнее, чтобы он не был поврежден в пути, а также
                    сохранять транспортную накладную или квитанцию в качестве
                    подтверждения осуществления возврата в случае порчи/потери
                    посылки курьерской службой.
                  </div>

                  <div className="text-sm md:text-base leading-[20px] md:leading-[22px]">
                    Сроки обмена товара надлежащего качества при этом остаются
                    прежними: 7 календарных дней с момента получения заказа.
                  </div>
                </div>

                <div className="place-self-start text-left flex flex-col max-w-[530px] leading-[22px] gap-2 md:gap-6">
                  <h4 className="uppercase font-bold text-[#919191] text-[10px] md:text-xs">
                    Информация о возврате товара
                  </h4>

                  <div className="text-sm md:text-base leading-[20px] md:leading-[22px]">
                    Вернуть товар надлежащего качества можно, если сохранены его
                    товарный вид, фабричные ярлыки, этикетки, потребительские
                    свойства, а также документ, подтверждающий факт покупки
                    указанного товара. Нельзя вернуть товар, бывший в
                    употреблении.
                  </div>

                  <div className="text-sm md:text-base leading-[20px] md:leading-[22px]">
                    Осуществить возврат изделий, которые вы приобрели в
                    онлайн-магазине Resego, согласно законодательству Российской
                    Федерации, можно в течение 7 дней с момента получения
                    заказа. Онлайн-магазин Resego имеет право отказать в
                    возврате в случаях обнаружения нарушений условий сохранения
                    товарного вида — в таком случае все затраты на доставку
                    возврата возлагаются на потребителя.
                  </div>

                  <div className="text-sm md:text-base leading-[20px] md:leading-[22px]">
                    При выявлении случаев возврата изделий после примерки с
                    признаками порчи или загрязнений, онлайн-магазин оставляет
                    за собой право установить ограничения для оформления заказов
                    с возможностью примерки для данного клиента. В таких случаях
                    клиент сможет оформить заказ только при условии полной
                    предварительной оплаты на сайте.
                    <br />
                    <i>
                      ** Согласно пункту 1 статьи 25 Закона РФ «О защите прав
                      потребителей» от 07.02.1992 № 2300-1. *** В соответствии с
                      пунктом 21 Постановления Правительства РФ от 27.09.2007 N
                      612 «Об утверждении Правил продажи товаров дистанционным
                      способом».
                    </i>
                    После одобрения возврата, мы перечислим денежные средства на
                    карту или банковский счет в срок до 10 банковских дней, для
                    этого необходимо заполнить полные реквизиты для перевода
                    денежных средств в заявлении на возврат. Сроки поступления
                    денежных средств на ваш расчетный счет зависят от скорости
                    обработки операции вашим банком и может достигать 30
                    календарных/рабочих дней.
                    <br /> Если возврат изделия не связан с выявлением его
                    производственных недостатков, порядок совершения
                    обмена/возврата изделий осуществляется согласно
                    утвержденному регламенту (составлено в соответствии с
                    действующим законодательством РФ в части офлайн и онлайн
                    торговли и закона «О защите прав потребителей»).
                    <i>
                      <br /> Обращаем внимание, что гарантия на изделия не
                      распространяется на следующие случаи:
                      <br /> — естественный эксплуатационный износ изделий;
                      <br /> — разрывы, порезы и потертости в области швов или
                      самого полотна вследствии неправильной эксплуатации;
                      <br /> — выгорание, выцветание и загрязнение изделий
                      вследствие неправильной эксплуатации или ухода за ним;
                      <br /> — образование катышек бывших в употреблении изделий
                      вследствии неправильной эксплуатации;
                      <br /> — иные дефекты, связанные с неправильной
                      эксплуатацией изделий, нарушением правил ухода, хранения и
                      транспортировки, а также в результате их порчи от действий
                      третьих лиц или непреодолимой силы.
                    </i>
                  </div>

                  <div className="text-sm md:text-base leading-[20px] md:leading-[22px]">
                    Сроки возврата товара надлежащего качества при этом остаются
                    прежними: 7 календарных дней с момента получения заказа.
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'care' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-20 items-start">
                <div className="place-self-start flex flex-col max-w-[530px] leading-[22px] gap-2 md:gap-6">
                  <h4 className="uppercase font-bold text-[#919191] text-[10px] md:text-xs">
                    Уход за одеждой Resego
                  </h4>

                  <div className="text-sm md:text-base leading-[20px] md:leading-[22px]">
                    1. Стирать при температуре не выше 30 градусов на деликатном
                    режиме. Лучше использовать жидкие средства для стирки
                    цветных тканей и кондиционер — это сохранит мягкость
                    материала и эластичность волокон.
                    <br />
                    2. Перед стиркой обязательно выворачивайте изделие
                    наизнанку. Это защитит шелкографию и внешний вид ткани от
                    механического трения. Сушить изделие рекомендуется в
                    расправленном виде, естественным способом, вдали от прямых
                    солнечных лучей и нагревательных приборов.
                    <br />
                    3. Не рекомендуется использовать машинную сушку. Высокая
                    температура может повредить лайкру, вызвать деформацию ткани
                    или усадку.
                    <br />
                    4. Гладить изделие лучше на низкой температуре, также
                    предварительно вывернув его наизнанку. Избегайте глажки по
                    принтам (шелкографии), чтобы не повредить рисунок.
                    <br />
                    5. Не используйте отбеливатели и пятновыводители точечно.
                    Такие средства могут повлиять на цвет ткани и повредить
                    структуру лайкры. Для удаления пятен лучше предварительно
                    замочить изделие целиком в мягком растворе.
                    <br />
                    6. Материалы с лайкрой эластичны, но не терпят чрезмерного
                    растяжения или механического воздействия. Избегайте ношения
                    с грубыми аксессуарами (цепи, ремни, сумки с жёсткими
                    краями), которые могут зацепить ткань или повредить
                    поверхность.
                  </div>
                </div>

                <div className="place-self-start text-left flex flex-col max-w-[530px] leading-[22px] gap-2 md:gap-6">
                  <h4 className="uppercase font-bold text-[#919191] text-[10px] md:text-xs">
                    Состав одежды Resego
                  </h4>

                  <div className="text-sm md:text-base leading-[20px] md:leading-[22px]">
                    <ul className="list-disc marker:font-bold pl-5">
                      <li>Шелкография</li>
                      <li>92% хлопок / 8% лайкра</li>
                      <li>240 г</li>
                      <li>Футер 2-х нитка</li>
                    </ul>
                  </div>

                  <div className="text-sm md:text-base leading-[20px] md:leading-[22px]">
                    Лайкра в составе делает ткань более упругой и износостойкой
                    — изделие сохраняет форму, не вытягивается и не теряет
                    посадку со временем.
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'requisites' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-20">
                <div className="place-self-start flex flex-col max-w-[470px] leading-[22px] gap-2 md:gap-6">
                  <h4 className="uppercase font-bold text-[#919191] text-[10px] md:text-xs">
                    Контакты
                  </h4>

                  <div className="text-sm md:text-base leading-[20px] md:leading-[22px]">
                    <div className="underline">Название организации</div>
                    <div>
                      ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ ПАХОМОВ ЯРОСЛАВ ПАВЛОВИЧ
                    </div>
                    <div className="underline">
                      Юридический адрес организации
                    </div>
                    <div>
                      163026, РОССИЯ, Г АРХАНГЕЛЬСК, УЛ СИБИРСКАЯ 1-й ПРОЕЗД Д 5
                      К 1
                    </div>
                    <div className="underline">ИНН</div>
                    <div>290126907505</div>
                    <div className="underline">ОГРН/ОГРНИП</div>
                    <div>325290000008297</div>
                  </div>
                </div>

                <div className="place-self-start text-left flex flex-col max-w-[530px] leading-[22px] gap-2 md:gap-6">
                  <h4 className="uppercase font-bold text-[#919191] text-[10px] md:text-xs">
                    Реквизиты
                  </h4>

                  <div className="text-sm md:text-base leading-[20px] md:leading-[22px]">
                    <div className="underline">Расчетный счет</div>
                    <div>40802810020000660073</div>
                    <div className="underline">Банк</div>
                    <div>ООО "Банк Точка"</div>
                    <div className="underline">ИНН банка</div>
                    <div>9721 1944 61</div>
                    <div className="underline">БИК банка</div>
                    <div>044525104</div>
                    <div className="underline">
                      Корреспондентский счет банка
                    </div>
                    <div>30101810745374525104</div>
                    <div className="underline">Юридический адрес банка</div>
                    <div>
                      109044, Российская Федерация, г. Москва, вн.тер.г.
                      муниципальный округ Южнопортовый, пер. 3-й Крутицкий,
                      д.11, помещ. 7Н
                    </div>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>

        <Footer scrollContainerRef={mainScrollRef} />
      </div>

      {/* {showQuiz && <Quiz />} */}
    </div>
  );
};

export default BuyersPage;
