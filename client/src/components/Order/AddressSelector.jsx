import { useEffect, useRef, useState } from 'react';
import axios from 'axios';

const SUGGEST_KEY = import.meta.env.VITE_YMAP_SUGGEST_API_KEY;

export function AddressSelector({ initialCoords, onSelect, hasError = false }) {
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  const [isFallback, setIsFallback] = useState(!SUGGEST_KEY);

  useEffect(() => {
    const onInputChange = () => {
      if (inputRef.current.value.trim() === '') {
        if (markerRef.current && mapRef.current) {
          mapRef.current.geoObjects.remove(markerRef.current);
          markerRef.current = null;
        }
        onSelect({ coords: null, address: '' });
      }
    };
    inputRef.current?.addEventListener('input', onInputChange);

    if (isFallback) {
      return () =>
        inputRef.current?.removeEventListener('input', onInputChange);
    }

    if (!window.ymaps) {
      console.error('Yandex.Maps SDK не загружен — fallback');
      setIsFallback(true);
      return;
    }

    (async function testSuggest() {
      try {
        const url =
          `https://suggest-maps.yandex.ru/v1/suggest` +
          `?apikey=${SUGGEST_KEY}&text=test&results=1&lang=ru_RU`;
        const resp = await axios.get(url);
        const data = resp.data;
        if (!Array.isArray(data.results) || data.results.length === 0) {
          throw new Error('empty results');
        }
      } catch (err) {
        console.warn('Suggest API недоступен — fallback:', err);
        setIsFallback(true);
        return;
      }

      window.ymaps.ready(initMapAndSuggest);
    })();

    async function initMapAndSuggest() {
      try {
        const testGeo = await window.ymaps.geocode('Москва', { results: 1 });
        if (!testGeo.geoObjects.getLength()) throw new Error();
      } catch {
        console.warn('Геокодер недоступен — fallback');
        setIsFallback(true);
        return;
      }

      containerRef.current.innerHTML = '';
      const map = new window.ymaps.Map(containerRef.current, {
        center: initialCoords || [59.94, 30.32],
        zoom: initialCoords ? 14 : 11,
        controls: ['zoomControl'],
      });
      mapRef.current = map;
      map.options.set('maxZoom', 20);
      map.options.set('openBalloonOnClick', false);
      [
        'searchControl',
        'trafficControl',
        'typeSelector',
        'geolocationControl',
        'rulerControl',
      ].forEach((n) => map.controls.remove(n));
      map.controls.add('routeButtonControl', { float: 'left' });
      map.controls.add('fullscreenControl', { float: 'right' });

      const placeMarker = (coords, address) => {
        if (markerRef.current) map.geoObjects.remove(markerRef.current);
        const pm = new window.ymaps.Placemark(
          coords,
          { balloonContent: address },
          { preset: 'islands#redDotIcon' }
        );
        map.geoObjects.add(pm);
        markerRef.current = pm;
        map.setCenter(coords, 20, { duration: 300 });
        onSelect({ coords, address });
      };

      if (initialCoords) {
        try {
          const res = await window.ymaps.geocode(initialCoords, { results: 1 });
          const o = res.geoObjects.get(0);
          placeMarker(initialCoords, o.getAddressLine());
          inputRef.current.value = o.getAddressLine();
        } catch {}
      }

      const suggest = new window.ymaps.SuggestView(inputRef.current);
      suggest.events.add('select', async (e) => {
        const query = e.get('item').value;
        try {
          const res = await window.ymaps.geocode(query, { results: 1 });
          const o = res.geoObjects.get(0);
          placeMarker(o.geometry.getCoordinates(), o.getAddressLine());
          inputRef.current.value = o.getAddressLine();
        } catch (err) {
          console.error('Геокодинг подсказки не удался:', err);
        }
        inputRef.current.focus();
      });

      map.events.add('click', async (e) => {
        try {
          const coords = e.get('coords');
          const res = await window.ymaps.geocode(coords, { results: 1 });
          const o = res.geoObjects.get(0);
          placeMarker(coords, o.getAddressLine());
          inputRef.current.value = o.getAddressLine();
        } catch (err) {
          console.error('Reverse geocode failed:', err);
        }
      });
    }

    return () => {
      inputRef.current?.removeEventListener('input', onInputChange);
      mapRef.current?.destroy();
      markerRef.current = null;
      mapRef.current = null;
    };
  }, [initialCoords, onSelect, isFallback]);

  const handleBlur = () => {
    if (!isFallback) return;
    onSelect({ coords: null, address: inputRef.current.value.trim() });
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="text"
        placeholder="Начните вводить адрес..."
        onBlur={handleBlur}
        autoComplete="off"
        className={`
          w-full h-[55px] outline-none placeholder:text-base border-b mb-4
          ${
            hasError ? 'px-2 border border-red-500' : 'border-[rgba(0,0,0,0.6)]'
          }
        `}
      />
      {hasError && (
        <div className="text-red-500 text-xs -mt-3 mb-4">
          Обязательно указать адрес
        </div>
      )}
      {!isFallback && (
        <div
          ref={containerRef}
          style={{ width: '100%', height: 300 }}
          className="shadow rounded"
        />
      )}
    </div>
  );
}
