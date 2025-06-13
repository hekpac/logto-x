import type { I18nPhrases } from '@logto/connector-kit';

export const isKeyOfI18nPhrases = (key: string, phrases: I18nPhrases): key is keyof I18nPhrases =>
  key in phrases;

export const getLocaleString = (locale: string, phrases: I18nPhrases): string =>
  (isKeyOfI18nPhrases(locale, phrases) && phrases[locale]) || phrases.en;
