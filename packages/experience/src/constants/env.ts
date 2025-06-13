import { yes } from '@silverhand/essentials';

export const isDevFeaturesEnabled =
  import.meta.env.PROD === false || yes(import.meta.env.DEV_FEATURES_ENABLED);
