import { useEffect, useMemo, useState } from 'react';
import { getAbVariant, trackAbExposureOnce } from './metrika';

export default function useABExperiment(experimentKey, variants = ['A', 'B', 'C']) {
  const [variant, setVariant] = useState(null);
  const variantsKey = useMemo(() => variants.join('|'), [variants]);

  useEffect(() => {
    if (!experimentKey) return;
    const v = getAbVariant(experimentKey, variants);
    setVariant(v);
    trackAbExposureOnce(experimentKey, v);
  }, [experimentKey, variants, variantsKey]);

  return variant;
}
