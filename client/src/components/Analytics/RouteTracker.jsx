import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { metrikaHit } from './metrika';

const RouteTracker = () => {
  const location = useLocation();
  const prevPathRef = useRef('');

  useEffect(() => {
    const nextPath =
      location.pathname + location.search + location.hash;

    if (nextPath !== prevPathRef.current) {
      metrikaHit(nextPath, {
        title: document.title,
        referer: document.referrer,
      });
      prevPathRef.current = nextPath;
    }
  }, [location]);

  return null;
};

export default RouteTracker;
