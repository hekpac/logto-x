const DEFAULT_THRESHOLD = 0.7;

const envValue = Number.parseFloat(process.env.CAPTCHA_SCORE_THRESHOLD ?? '');
export const defaultScoreThreshold = Number.isFinite(envValue)
  ? Math.min(Math.max(envValue, 0), 1)
  : DEFAULT_THRESHOLD;
