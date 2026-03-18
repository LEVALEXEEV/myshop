const METRIKA_ID = 107967872;
const STORAGE_PREFIX = 'ab:';
const EXPOSURE_PREFIX = 'ab:exp:';

const hasWindow = () => typeof window !== 'undefined';

export const isMetrikaReady = () =>
  hasWindow() && typeof window.ym === 'function';

export const metrikaHit = (url, options = {}) => {
  if (!isMetrikaReady() || !url) return;
  window.ym(METRIKA_ID, 'hit', url, options);
};

export const metrikaReachGoal = (goalName, params = {}) => {
  if (!isMetrikaReady() || !goalName) return;
  window.ym(METRIKA_ID, 'reachGoal', goalName, params);
};

export const getAbVariant = (experimentKey, variants = ['A', 'B']) => {
  if (!experimentKey || !variants.length) return null;
  if (!hasWindow()) return variants[0] ?? null;

  const storageKey = STORAGE_PREFIX + experimentKey;
  const current = window.localStorage.getItem(storageKey);
  if (current && variants.includes(current)) return current;

  const idx = Math.floor(Math.random() * variants.length);
  const assigned = variants[idx];
  window.localStorage.setItem(storageKey, assigned);
  return assigned;
};

export const trackAbExposure = (experimentKey, variant) => {
  if (!experimentKey || !variant) return;
  metrikaReachGoal('ab_exposure', {
    experiment: experimentKey,
    variant,
  });
};

export const trackAbExposureOnce = (experimentKey, variant) => {
  if (!experimentKey || !variant || !hasWindow()) return;

  const sessionKey = `${EXPOSURE_PREFIX}${experimentKey}:${variant}`;
  if (window.sessionStorage.getItem(sessionKey) === '1') return;

  trackAbExposure(experimentKey, variant);
  window.sessionStorage.setItem(sessionKey, '1');
};

export const trackAbConversion = (experimentKey, variant, conversionGoal) => {
  if (!experimentKey || !variant || !conversionGoal) return;
  metrikaReachGoal('ab_conversion', {
    experiment: experimentKey,
    variant,
    conversion_goal: conversionGoal,
  });
};
