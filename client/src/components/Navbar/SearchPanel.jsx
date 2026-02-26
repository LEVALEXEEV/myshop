import { useEffect, useState, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import searchIcon from '../../assets/search.svg';
import closeIcon from '../../assets/close.svg';
import notFound from '../../assets/not-found.svg';
import clearResults from '../../assets/clear-results.svg';
import SearchResultItem from './SearchResultItem';
import { useDebouncedSearch } from '../../hooks/useDebouncedSearch';

export default function SearchPanel({
  visible,
  onClose,
  animState,
  scrollContainerRef,
}) {
  const [query, setQuery] = useState('');
  const results = useDebouncedSearch(query);

  const trimmedQuery = query.trim();
  const isExpanded = trimmedQuery.length > 0;
  const showResults = trimmedQuery.length >= 2;

  const emptyState = useMemo(
    () => (
      <div className="flex flex-1 flex-col items-center mt-[50px] text-sm font-light gap-5 text-[#464646]">
        <img
          src={notFound}
          alt="Ничего не найдено"
          className="w-[35px] h-[43px]"
        />
        <div>Ничего не найдено</div>
      </div>
    ),
    []
  );

  const handleInput = useCallback((e) => {
    setQuery(e.target.value);
  }, []);

  const clearQuery = useCallback(() => {
    setQuery('');
  }, []);

  useEffect(() => {
    const sc = scrollContainerRef?.current;
    if (!sc) return;
    if (isExpanded) {
      sc.style.overflow = 'hidden';
    } else {
      sc.style.overflow = '';
    }
    return () => {
      sc.style.overflow = '';
    };
  }, [isExpanded, scrollContainerRef]);

  if (!visible) return null;

  return (
    <header
      className={`search-panel fixed top-0 z-50 bg-white flex flex-col ${animState} ${
        isExpanded
          ? 'left-0 right-0 w-full h-full'
          : 'left-0 right-[var(--sbw)] w-[calc(100%-var(--sbw))] h-[59px] md:h-[150px]'
      }`}
    >
      <div className="h-[59px] md:h-[150px] px-search flex items-center shadow-[0_5px_10px_0_rgba(0,0,0,0.1)]">
        <div className="relative flex items-center gap-6 w-full">
          <div className="absolute left-1.5 md:left-3.5 top-4 pointer-events-none">
            <img src={searchIcon} alt="Поиск" className="w-7.5 h-7.5" />
          </div>
          <input
            type="text"
            className="w-full h-[59px] md:h-[60px] bg-[#f2f2f2] rounded-sm pl-11.5 md:pl-14 pr-10 outline-none placeholder:text-[#bbbbbb]"
            placeholder="Поиск"
            value={query}
            onChange={handleInput}
            spellCheck={false}
          />
          {query && (
            <div
              className="absolute right-2 md:right-4 bg-[#ebebeb] w-6 h-6 rounded-full flex justify-center items-center top-1/2 -translate-y-1/2 cursor-pointer"
              onClick={clearQuery}
            >
              <img src={clearResults} alt="Очистить" />
            </div>
          )}
        </div>
        <button className="mr-1 ml-6 md:mr-0 md:ml-12" onClick={onClose}>
          <img
            src={closeIcon}
            alt="Закрыть"
            className="cursor-pointer w-[18px] h-[18px] md:w-7 md:h-7"
          />
        </button>
      </div>

      {isExpanded && (
        <div
          className={`
            flex-1 overflow-y-auto px-search pb-[50px] flex flex-col
            scroll-container ${showResults ? 'scroll-fade-in' : ''}
          `}
        >
          {showResults && results.length > 0 && (
            <div className="my-5 md:my-[30px] text-xs font-light text-black animate-fadeInOpacity">
              {results.length} результат{results.length === 1 ? '' : 'а'} по
              запросу: {query}
            </div>
          )}

          {!showResults || results.length === 0 ? (
            emptyState
          ) : (
            <div className="flex flex-col gap-5 md:grid md:grid-cols-2 md:gap-6 animate-fadeInOpacity">
              {results.map((p) => (
                <SearchResultItem key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      )}
    </header>
  );
}

SearchPanel.propTypes = {
  visible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  animState: PropTypes.oneOf(['enter', 'leave']).isRequired,
  scrollContainerRef: PropTypes.object,
};
