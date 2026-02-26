import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { aboutContent } from '../../constants/aboutContent';

const AboutSection = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { leftSections, rightSections } = aboutContent;

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 768px)');
    const onChange = (e) => setIsMobile(e.matches);
    mql.addEventListener('change', onChange);
    setIsMobile(mql.matches);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  const shouldShowExpandable = isExpanded || isMobile;

  return (
    <section className="font-arial w-full px-4 pt-12 pb-8 md:px-about md:px-0 md:pt-[80px] md:pb-[60px]">
      <div className={isExpanded ? 'about-expanded' : 'about-collapsed'}>
        <div className="flex flex-col-reverse gap-8 lg:flex-row md:gap-12 lg:gap-35">
          <div className="lg:w-1/2 flex flex-col gap-8">
            {leftSections.map(({ title, content }, i) => (
              <div key={i}>
                <h3 className="uppercase mb-3 md:mb-2 text-[12px] md:heading-h3 text-[#797979] font-bold">
                  {title}
                </h3>
                <p
                  className="paragraph-main"
                  dangerouslySetInnerHTML={{ __html: content }}
                />
              </div>
            ))}
          </div>

          <div className="lg:w-1/2 flex flex-col gap-6 md:gap-8">
            <h2 className="heading-h2 font-bold tracking-[-1px] uppercase">
              Миссия Resego – передать дух спорта, дерзости и силы через одежду.
            </h2>
            {rightSections
              .filter((section) => !section.expandable)
              .map((section, idx) => (
                <p key={idx} className="paragraph-main">
                  {section.text}
                </p>
              ))}

            <AnimatePresence initial={false}>
              {shouldShowExpandable && (
                <motion.p
                  className="paragraph-main"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.4, ease: 'easeInOut' }}
                >
                  {rightSections.find((sec) => sec.expandable).text}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="w-full flex items-center mt-4 md:mt-8">
        <div className="flex-1 border-t border-gray-300" />
        <button
          onClick={() => setIsExpanded((prev) => !prev)}
          className="mx-4 inline-flex items-center space-x-2 text-gray-500 paragraph-main hover:text-black transition bg-white"
        >
          <span>{isExpanded ? 'Свернуть' : 'Показать больше'}</span>
          <svg
            className={`w-5 h-5 transition-transform ${
              isExpanded ? 'rotate-180' : ''
            }`}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
        <div className="flex-1 border-t border-gray-300" />
      </div>
    </section>
  );
};

export default AboutSection;
