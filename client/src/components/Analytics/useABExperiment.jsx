import { useEffect, useState } from 'react';
import { getAbVariant, trackAbExposure } from './metrika';

export default function useABExperiment(experimentKey, variants = ['A', 'B', 'C']) {
  const [variant, setVariant] = useState(null);

  useEffect(() => {
    if (!experimentKey) return;
    const v = getAbVariant(experimentKey, variants);
    setVariant(v);
    trackAbExposure(experimentKey, v);
  }, [experimentKey, JSON.stringify(variants)]);

  return variant;
}
