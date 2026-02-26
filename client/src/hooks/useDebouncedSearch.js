import { useState, useEffect } from 'react';
import axios from 'axios';

export function useDebouncedSearch(query, delay = 1000) {
  const [results, setResults] = useState([]);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const { data } = await axios.get('/api/products', {
          params: { search: query },
        });
        setResults(data);
      } catch (err) {
        console.error(err);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [query, delay]);

  return results;
}
