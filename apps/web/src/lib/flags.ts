export const FEAT_OCR = import.meta.env.VITE_FEATURE_OCR === 'on';
export const FEAT_PM_SENTRY = import.meta.env.VITE_FEATURE_PM_SENTRY === 'on';
export const FEAT_DELIVERY = import.meta.env.VITE_FEATURE_DELIVERY === 'on';

export function isEnabled(flag: { rollout: number }, seed: string) {
  let hash = 5381;
  for (let i = 0; i < seed.length; i += 1) {
    hash = ((hash << 5) + hash) + seed.charCodeAt(i);
  }
  const pct = (hash >>> 0) / 0xffffffff;
  return pct < flag.rollout;
}
